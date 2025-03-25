
const API_KEY = "6ebed3c13dde4fb5a2e3abe3ab2b8e3c"
const BASE_URL = "https://newsapi.org/v2"


const preloader = document.getElementById("preloader")
const newsGrid = document.getElementById("news-grid")
const newsCarousel = document.getElementById("news-carousel")
const carouselIndicators = document.getElementById("carousel-indicators")
const carouselPrev = document.getElementById("carousel-prev")
const carouselNext = document.getElementById("carousel-next")
const tickerContent = document.getElementById("ticker-content")
const searchInput = document.getElementById("search-input")
const searchBtn = document.getElementById("search-btn")
const categoryBtns = document.querySelectorAll(".category-btn")
const loadMoreBtn = document.getElementById("load-more-btn")
const themeToggle = document.getElementById("theme-toggle")
const bookmarkBtn = document.getElementById("bookmark-btn")
const bookmarkPanel = document.getElementById("bookmark-panel")
const bookmarkList = document.getElementById("bookmark-list")
const closeBookmarks = document.getElementById("close-bookmarks")
const overlay = document.getElementById("overlay")
const viewBtns = document.querySelectorAll(".view-btn")
const shareModal = document.getElementById("share-modal")
const shareTitle = document.getElementById("share-title")
const shareFacebook = document.getElementById("share-facebook")
const shareTwitter = document.getElementById("share-twitter")
const shareWhatsApp = document.getElementById("share-whatsapp")
const shareCopy = document.getElementById("share-copy")
const closeShareModal = document.getElementById("close-share-modal")
const notification = document.getElementById("notification")


let currentPage = 1
let currentCategory = "general"
let articles = []
const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || []
let carouselInterval
let currentCarouselIndex = 0
let carouselItems = []
let currentView = "grid"
let currentShareUrl = ""


function init() {
  
  checkThemePreference()

 
  setTimeout(() => {
    preloader.classList.add("hidden")
    document.body.classList.add("loaded")
  }, 1500) 

 
  fetchBreakingNews()

  
  fetchTrendingNews()


  fetchNews(currentCategory)


  renderBookmarks()


  setupEventListeners()
}


async function fetchNews(category, query = "", page = 1) {
  try {
    // Show loading state
    if (page === 1) {
      newsGrid.innerHTML = `
                <div class="loading-articles">
                    <div class="loading-pulse"></div>
                    <p>Loading articles...</p>
                </div>
            `
    }

    let url
    if (query) {
      url = `${BASE_URL}/everything?q=${query}&apiKey=${API_KEY}&page=${page}&pageSize=12&language=en`
    } else {
      url = `${BASE_URL}/top-headlines?country=us&category=${category}&apiKey=${API_KEY}&page=${page}&pageSize=12`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "ok") {
      if (page === 1) {
        articles = data.articles
        renderNews(articles)
      } else {
        articles = [...articles, ...data.articles]
        appendNews(data.articles)
      }

   
      if (data.articles.length < 12) {
        loadMoreBtn.style.display = "none"
      } else {
        loadMoreBtn.style.display = "block"
      }
    } else {
      showError("Failed to fetch news. Please try again later.")
    }
  } catch (error) {
    showError("An error occurred. Please check your connection.")
    console.error("Error fetching news:", error)
  }
}


async function fetchTrendingNews() {
  try {
    const url = `${BASE_URL}/top-headlines?country=us&apiKey=${API_KEY}&pageSize=5`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "ok") {
      carouselItems = data.articles.slice(0, 5)
      renderCarousel(carouselItems)
    }
  } catch (error) {
    console.error("Error fetching trending news:", error)
  }
}


async function fetchBreakingNews() {
  try {
    
    tickerContent.innerHTML = `<span class="ticker-item">Loading breaking news...</span>`

    const url = `${BASE_URL}/top-headlines?country=us&category=general&apiKey=${API_KEY}&pageSize=5`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "ok") {
      renderTicker(data.articles.slice(0, 5))
    } else {
      
      tickerContent.innerHTML = `<span class="ticker-item">Stay tuned for the latest breaking news</span>`
    }
  } catch (error) {
    console.error("Error fetching breaking news:", error)
    
    tickerContent.innerHTML = `<span class="ticker-item">Stay tuned for the latest breaking news</span>`
  }
}


function renderNews(articles) {
  newsGrid.innerHTML = ""

  if (articles.length === 0) {
    newsGrid.innerHTML = '<div class="no-results">No articles found. Try a different search term or category.</div>'
    loadMoreBtn.style.display = "none"
    return
  }

  articles.forEach((article, index) => {
    if (!article.title || !article.url) return

    
    const articleId = article.url.split("://")[1].replace(/[^\w]/g, "-")
    const isBookmarked = bookmarks.some((bookmark) => bookmark.url === article.url)

    const newsCard = document.createElement("div")
    newsCard.className = "news-card"
    newsCard.setAttribute("data-id", articleId)
    newsCard.style.animationDelay = `${index * 0.1}s`

    const sourceText = article.source?.name || "Unknown Source"
    const publishedDate = article.publishedAt ? formatDate(article.publishedAt) : "Recent"
    const imageUrl =
      article.urlToImage || `https://source.unsplash.com/random/600x400?${article.source?.name || "news"},${index}`

    newsCard.innerHTML = `
            <div class="news-image">
                <img src="${imageUrl}" alt="${article.title}" loading="lazy">
            </div>
            <div class="news-content">
                <span class="news-category">${article.source?.name || "News"}</span>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || "No description available"}</p>
                <div class="news-footer">
                    <span class="news-source"><i class="far fa-clock"></i> ${publishedDate}</span>
                    <div class="news-actions">
                        <button class="bookmark-action ${isBookmarked ? "bookmarked" : ""}" data-url="${article.url}" title="${isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}">
                            <i class="fas ${isBookmarked ? "fa-bookmark" : "fa-bookmark"}"></i>
                        </button>
                        <button class="share-action" data-title="${article.title}" data-url="${article.url}" title="Share article">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `

    newsGrid.appendChild(newsCard)

   
    const titleElement = newsCard.querySelector(".news-title")
    titleElement.addEventListener("click", () => {
      window.open(article.url, "_blank")
    })
  })

  applyCurrentView()
}


function appendNews(articles) {
  articles.forEach((article, index) => {
    if (!article.title || !article.url) return

   
    const articleId = article.url.split("://")[1].replace(/[^\w]/g, "-")
    const isBookmarked = bookmarks.some((bookmark) => bookmark.url === article.url)

    const newsCard = document.createElement("div")
    newsCard.className = "news-card"
    newsCard.setAttribute("data-id", articleId)
    newsCard.style.animationDelay = `${index * 0.1}s`

    const sourceText = article.source?.name || "Unknown Source"
    const publishedDate = article.publishedAt ? formatDate(article.publishedAt) : "Recent"
    const imageUrl =
      article.urlToImage ||
      `https://source.unsplash.com/random/600x400?${article.source?.name || "news"},${index + articles.length}`

    newsCard.innerHTML = `
            <div class="news-image">
                <img src="${imageUrl}" alt="${article.title}" loading="lazy">
            </div>
            <div class="news-content">
                <span class="news-category">${article.source?.name || "News"}</span>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || "No description available"}</p>
                <div class="news-footer">
                    <span class="news-source"><i class="far fa-clock"></i> ${publishedDate}</span>
                    <div class="news-actions">
                        <button class="bookmark-action ${isBookmarked ? "bookmarked" : ""}" data-url="${article.url}" title="${isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}">
                            <i class="fas ${isBookmarked ? "fa-bookmark" : "fa-bookmark"}"></i>
                        </button>
                        <button class="share-action" data-title="${article.title}" data-url="${article.url}" title="Share article">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `

    newsGrid.appendChild(newsCard)

 
    const titleElement = newsCard.querySelector(".news-title")
    titleElement.addEventListener("click", () => {
      window.open(article.url, "_blank")
    })
  })

  applyCurrentView()
}


function renderCarousel(articles) {
  newsCarousel.innerHTML = ""
  carouselIndicators.innerHTML = ""

  articles.forEach((article, index) => {
    if (!article.title) return

    const carouselItem = document.createElement("div")
    carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`

    const imageUrl =
      article.urlToImage || `https://source.unsplash.com/random/1200x600?${article.source?.name || "news"},${index}`
    carouselItem.style.backgroundImage = `url(${imageUrl})`

    const category = article.source?.name || "Featured"

    carouselItem.innerHTML = `
            <div class="carousel-content">
                <span class="carousel-category">${category}</span>
                <h3>${article.title}</h3>
                <p>${article.description || ""}</p>
                <a href="${article.url}" target="_blank" class="read-more">Read Full Story</a>
            </div>
        `

    newsCarousel.appendChild(carouselItem)

    const indicator = document.createElement("div")
    indicator.className = `carousel-indicator ${index === 0 ? "active" : ""}`
    indicator.dataset.index = index
    carouselIndicators.appendChild(indicator)

  
    indicator.addEventListener("click", () => {
      showCarouselItem(index)
    })
  })


  startCarouselRotation()
}


function startCarouselRotation() {
  
  if (carouselInterval) {
    clearInterval(carouselInterval)
  }


  carouselInterval = setInterval(() => {
    nextCarouselItem()
  }, 6000) 
}


function showCarouselItem(index) {
  const items = document.querySelectorAll(".carousel-item")
  const indicators = document.querySelectorAll(".carousel-indicator")

  if (items.length === 0) return

  
  items.forEach((item) => item.classList.remove("active"))
  indicators.forEach((indicator) => indicator.classList.remove("active"))

  
  items[index].classList.add("active")
  indicators[index].classList.add("active")


  currentCarouselIndex = index
}


function nextCarouselItem() {
  const items = document.querySelectorAll(".carousel-item")
  if (items.length === 0) return

  const nextIndex = (currentCarouselIndex + 1) % items.length
  showCarouselItem(nextIndex)
}


function prevCarouselItem() {
  const items = document.querySelectorAll(".carousel-item")
  if (items.length === 0) return

  const prevIndex = (currentCarouselIndex - 1 + items.length) % items.length
  showCarouselItem(prevIndex)
}


function renderTicker(articles) {
  let tickerHTML = ""

  articles.forEach((article) => {
    if (!article.title) return
    tickerHTML += `<span class="ticker-item">${article.title}</span>`
  })

  tickerContent.innerHTML = tickerHTML

 
  const tickerContentElement = document.querySelector(".ticker-content")
  if (tickerContentElement) {
    
    tickerContentElement.style.animationDuration = "60s" 
  }
}


function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
    }
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
}


function toggleBookmark(url) {
  const article = articles.find((article) => article.url === url)

  if (!article) return

  const bookmarkIndex = bookmarks.findIndex((bookmark) => bookmark.url === url)

  if (bookmarkIndex === -1) {
    // Add to bookmarks
    bookmarks.push({
      title: article.title,
      url: article.url,
      source: article.source?.name || "Unknown Source",
      publishedAt: article.publishedAt || new Date().toISOString(),
    })

    // Show notification
    showNotification("Article added to bookmarks", "success")
  } else {
    // Remove from bookmarks
    bookmarks.splice(bookmarkIndex, 1)

    // Show notification
    showNotification("Article removed from bookmarks", "success")
  }

  // Update localStorage
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks))

  // Update UI
  renderBookmarks()
  updateBookmarkButtons()
}

// Render bookmarks
function renderBookmarks() {
  if (bookmarks.length === 0) {
    bookmarkList.innerHTML =
      '<div class="no-bookmarks">No bookmarks yet. Click the bookmark icon on any article to save it here.</div>'
    return
  }

  bookmarkList.innerHTML = ""

  bookmarks.forEach((bookmark) => {
    const bookmarkItem = document.createElement("div")
    bookmarkItem.className = "bookmark-item"

    const publishedDate = bookmark.publishedAt ? formatDate(bookmark.publishedAt) : "Recent"

    bookmarkItem.innerHTML = `
            <h4 class="bookmark-title">${bookmark.title}</h4>
            <div class="bookmark-source">
                <i class="fas fa-newspaper"></i>
                <span>${bookmark.source}</span> • ${publishedDate}
            </div>
            <div class="bookmark-actions">
                <a href="${bookmark.url}" target="_blank">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Read</span>
                </a>
                <button class="remove-bookmark" data-url="${bookmark.url}">
                    <i class="fas fa-trash-alt"></i>
                    <span>Remove</span>
                </button>
            </div>
        `

    bookmarkList.appendChild(bookmarkItem)
  })
}


function updateBookmarkButtons() {
  const bookmarkButtons = document.querySelectorAll(".bookmark-action")

  bookmarkButtons.forEach((button) => {
    const url = button.dataset.url
    const isBookmarked = bookmarks.some((bookmark) => bookmark.url === url)

    if (isBookmarked) {
      button.classList.add("bookmarked")
      button.title = "Remove from bookmarks"
    } else {
      button.classList.remove("bookmarked")
      button.title = "Add to bookmarks"
    }
  })
}

function openShareModal(title, url) {
  shareTitle.textContent = title
  currentShareUrl = url

 
  shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  shareTwitter.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`

  // Show modal
  shareModal.classList.add("active")
}

// Close share modal
function closeShareModalFunc() {
  shareModal.classList.remove("active")
}

// Copy link to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Link copied to clipboard", "success")
    })
    .catch((err) => {
      console.error("Failed to copy: ", err)
      showNotification("Failed to copy link", "error")
    })
}

// Show notification
function showNotification(message, type) {
  const notificationContent = notification.querySelector(".notification-content")
  const notificationIcon = notification.querySelector(".notification-icon")
  const notificationMessage = notification.querySelector(".notification-message")

  // Set icon and class based on type
  if (type === "success") {
    notificationIcon.className = "notification-icon fas fa-check-circle"
    notification.className = "notification success"
  } else if (type === "error") {
    notificationIcon.className = "notification-icon fas fa-exclamation-circle"
    notification.className = "notification error"
  }

  // Set message
  notificationMessage.textContent = message

  // Show notification
  notification.classList.add("active")

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("active")
  }, 3000)
}

// Toggle theme
function toggleTheme() {
  const body = document.body
  const isDarkMode = body.classList.contains("dark-mode")

  // Toggle classes
  if (isDarkMode) {
    body.classList.remove("dark-mode")
    body.classList.add("light-mode")
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>'
  } else {
    body.classList.remove("light-mode")
    body.classList.add("dark-mode")
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>'
  }

  // Save preference
  localStorage.setItem("darkMode", !isDarkMode)
}

// Check theme preference
function checkThemePreference() {
  const darkMode = localStorage.getItem("darkMode") === "true"

  if (darkMode) {
    document.body.classList.add("dark-mode")
    document.body.classList.remove("light-mode")
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>'
  } else {
    document.body.classList.remove("dark-mode")
    document.body.classList.add("light-mode")
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>'
  }
}

// Toggle bookmark panel
function toggleBookmarkPanel() {
  bookmarkPanel.classList.toggle("active")
  overlay.classList.toggle("active")
}

// Change view (grid or list)
function changeView(view) {
  currentView = view

  // Update active button
  viewBtns.forEach((btn) => {
    if (btn.dataset.view === view) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })

  // Apply view
  applyCurrentView()
}

// Apply current view
function applyCurrentView() {
  if (currentView === "grid") {
    newsGrid.classList.remove("list-view")
  } else {
    newsGrid.classList.add("list-view")
  }
}


function showError(message) {
  newsGrid.innerHTML = `<div class="error-message">${message}</div>`
  loadMoreBtn.style.display = "none"
}


function setupEventListeners() {

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim()
    if (query) {
      currentPage = 1
      fetchNews("", query)
     
      setTimeout(() => {
        document.querySelector(".section-header").scrollIntoView({ behavior: "smooth" })
      }, 500)
    }
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim()
      if (query) {
        currentPage = 1
        fetchNews("", query)
        
        setTimeout(() => {
          document.querySelector(".section-header").scrollIntoView({ behavior: "smooth" })
        }, 500) 
      }
    }
  })

  categoryBtns.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category

      // Update active button
      categoryBtns.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      currentCategory = category
      currentPage = 1
      fetchNews(category)
    })
  })


  loadMoreBtn.addEventListener("click", () => {
    currentPage++
    const query = searchInput.value.trim()
    fetchNews(currentCategory, query, currentPage)
  })

  themeToggle.addEventListener("click", toggleTheme)


  bookmarkBtn.addEventListener("click", toggleBookmarkPanel)
  closeBookmarks.addEventListener("click", toggleBookmarkPanel)
  overlay.addEventListener("click", toggleBookmarkPanel)


  viewBtns.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view
      changeView(view)
    })
  })


  carouselPrev.addEventListener("click", prevCarouselItem)
  carouselNext.addEventListener("click", nextCarouselItem)


  closeShareModal.addEventListener("click", closeShareModalFunc)
  shareCopy.addEventListener("click", () => {
    copyToClipboard(currentShareUrl)
  })


  newsGrid.addEventListener("click", (e) => {
    const bookmarkAction = e.target.closest(".bookmark-action")
    const shareAction = e.target.closest(".share-action")

    if (bookmarkAction) {
      const url = bookmarkAction.dataset.url
      toggleBookmark(url)
    } else if (shareAction) {
      const title = shareAction.dataset.title
      const url = shareAction.dataset.url
      openShareModal(title, url)
    }
  })

  bookmarkList.addEventListener("click", (e) => {
    const removeButton = e.target.closest(".remove-bookmark")

    if (removeButton) {
      const url = removeButton.dataset.url
      toggleBookmark(url)
    }
  })


  document.querySelectorAll(".footer-categories a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const category = link.dataset.category

    
      categoryBtns.forEach((btn) => {
        if (btn.dataset.category === category) {
          btn.classList.add("active")
        } else {
          btn.classList.remove("active")
        }
      })

      
      currentCategory = category
      currentPage = 1
      fetchNews(category)

  
      document.querySelector(".categories-section").scrollIntoView({ behavior: "smooth" })
    })
  })
}


document.addEventListener("DOMContentLoaded", init)

