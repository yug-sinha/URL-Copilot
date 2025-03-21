import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import os
import logging
from urllib.parse import urljoin, urlparse
import concurrent.futures
from fastapi import HTTPException
from google.api_core.exceptions import InvalidArgument
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def fetch_with_requests(url):
    """Fetch page content using requests."""
    try:
        logger.info(f"Attempting to fetch URL via requests: {url}")
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        logger.info(f"Successfully fetched {url} using requests.")
        return res.text
    except Exception as e:
        logger.warning(f"Requests failed for {url}: {e}")
        return ""

def fetch_with_playwright(url):
    """Fallback: Fetch page content using Playwright for JS-rendered sites."""
    try:
        logger.info(f"Falling back to Playwright for URL: {url}")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=15000)
            content = page.content()
            browser.close()
            logger.info(f"Successfully fetched {url} using Playwright.")
            return content
    except Exception as e:
        logger.exception(f"Playwright failed for {url}: {e}")
        return ""

def fetch_page(url):
    """
    Attempt to fetch the page content using requests first.
    If it fails or returns empty, fall back to using Playwright.
    """
    content = fetch_with_requests(url)
    if not content or len(content.strip()) == 0:
        logger.info(f"No content from requests for {url}. Trying Playwright.")
        content = fetch_with_playwright(url)
    return content

def extract_text_from_url(url, max_child_urls=30):
    """
    Extracts text from the parent URL and up to max_child_urls direct child links.
    No recursion is performed: only links found on the parent page are used.
    """
    logger.info(f"Extracting text from PARENT URL: {url}")
    parent_html = fetch_page(url)
    if not parent_html:
        return "Error: No content found for the parent URL."
    
    # Extract text from the parent page.
    parent_soup = BeautifulSoup(parent_html, "html.parser")
    parent_text = parent_soup.get_text(separator=" ", strip=True) or ""
    
    # Gather up to max_child_urls direct links from the parent page (same domain only).
    base_domain = urlparse(url).netloc
    child_links = []
    logger.info(f"Looking for up to {max_child_urls} same-domain child links on the parent page.")
    for a in parent_soup.find_all("a", href=True):
        child = urljoin(url, a["href"])
        if urlparse(child).netloc == base_domain and child not in child_links:
            child_links.append(child)
            if len(child_links) >= max_child_urls:
                break
    
    logger.info(f"Found {len(child_links)} child URLs. Fetching them in parallel...")
    
    # Fetch child pages concurrently.
    child_texts = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(fetch_page, link): link for link in child_links}
        for future in concurrent.futures.as_completed(future_to_url):
            child_url = future_to_url[future]
            try:
                child_html = future.result()
                if child_html:
                    soup = BeautifulSoup(child_html, "html.parser")
                    child_text = soup.get_text(separator=" ", strip=True)
                    child_texts.append(child_text)
                    logger.info(f"Fetched text from CHILD URL: {child_url}")
            except Exception as e:
                logger.exception(f"Error fetching child URL {child_url}: {e}")
    
    # Combine parent text with child texts.
    combined = parent_text + "\n\n" + "\n\n".join(child_texts)
    logger.info(f"Final combined text length: {len(combined)} characters")
    return combined

def init_gemini():
    logger.info("Initializing Gemini model...")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    genai.configure(api_key=api_key)
    logger.info("Gemini model initialized successfully.")
    return genai.GenerativeModel("gemini-2.0-flash")

def ask_gemini(model, context, question):
    # Trim context to Gemini’s 40,000-character max
    if len(context) > 40000:
        logger.info(f"Context length {len(context)} > 40000, truncating.")
        context = context[:40000]
    
    logger.info(f"Sending to Gemini. Prompt length: {len(context)} chars")
    try:
        chat = model.start_chat(history=[])
        prompt = f"Context:\n{context}\n\nQuestion:\n{question}"
        return chat.send_message(prompt).text
    except InvalidArgument:
        logger.error("Invalid Gemini API key")
        raise HTTPException(status_code=401, detail="Invalid Gemini API key")
    except Exception as e:
        logger.exception("Error during Gemini response")
        return f"Error: {e}"