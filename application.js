let mouseoverTimer
let lastTouchTimestamp
const prefetches = new Set()
const prefetchElement = document.createElement('link')
const allowQueryString = 'instantAllowQueryString' in document.body.dataset
const allowExternalLinks = 'instantAllowExternalLinks' in document.body.dataset
const useWhitelist = 'instantWhitelist' in document.body.dataset
const mousedownShortcut = 'instantMousedownShortcut' in document.body.dataset
const DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION = 1111
let delayOnHover = 65
let useMousedown = false
let useMousedownOnly = false
let useViewport = false
if ('instantIntensity' in document.body.dataset) {
  const intensity = document.body.dataset.instantIntensity
  if (intensity.substr(0, 'mousedown'.length) == 'mousedown') {
    useMousedown = true
    if (intensity == 'mousedown-only') {
      useMousedownOnly = true
    }
  }
  else if (intensity.substr(0, 'viewport'.length) == 'viewport') {
    if (!(navigator.connection && (navigator.connection.saveData || (navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g'))))) {
      if (intensity == "viewport") {
        if (document.documentElement.clientWidth * document.documentElement.clientHeight < 450000) {
          useViewport = true
        }
      }
      else if (intensity == "viewport-all") {
        useViewport = true
      }
    }
  }else {
    const milliseconds = parseInt(intensity)
    if (!isNaN(milliseconds)) {
      delayOnHover = milliseconds
    }
  }
}
  const eventListenersOptions = {
    capture: true,
    passive: true,
  }
  if (!useMousedownOnly) {
    document.addEventListener('touchstart', touchstartListener, eventListenersOptions)
  }
  if (!useMousedown) {
    document.addEventListener('mouseover', mouseoverListener, eventListenersOptions)
  }
  else if (!mousedownShortcut) {
      document.addEventListener('mousedown', mousedownListener, eventListenersOptions)
  }
  if (mousedownShortcut) {
    document.addEventListener('mousedown', mousedownShortcutListener, eventListenersOptions)
  }
  if (useViewport) {
    let triggeringFunction
    if (window.requestIdleCallback) {
      triggeringFunction = (callback) => {
        requestIdleCallback(callback, {
          timeout: 1500,
        })
      }
    }
    else {
      triggeringFunction = (callback) => {
        callback()
      }
    }
    triggeringFunction(() => {
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const linkElement = entry.target
            intersectionObserver.unobserve(linkElement)
            preload(linkElement.href)
          }
        })
      })
      document.querySelectorAll('a').forEach((linkElement) => {
        if (isPreloadable(linkElement)) {
          intersectionObserver.observe(linkElement)
        }
      })
    })
  }
function touchstartListener(event) {
  lastTouchTimestamp = performance.now()
  const linkElement = event.target.closest('a')
  if (!isPreloadable(linkElement)) {
    return
  }
  preload(linkElement.href)
}
function mouseoverListener(event) {
  if (performance.now() - lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
    return
  }
  const linkElement = event.target.closest('a')
  if (!isPreloadable(linkElement)) {
    return
  }
  linkElement.addEventListener('mouseout', mouseoutListener, {passive: true})
  mouseoverTimer = setTimeout(() => {
    preload(linkElement.href)
    mouseoverTimer = undefined
  }, delayOnHover)
}
function mousedownListener(event) {
  const linkElement = event.target.closest('a')
  if (!isPreloadable(linkElement)) {
    return
  }
  preload(linkElement.href)
}
function mouseoutListener(event) {
  if (event.relatedTarget && event.target.closest('a') == event.relatedTarget.closest('a')) {
    return
  }
  if (mouseoverTimer) {
    clearTimeout(mouseoverTimer)
    mouseoverTimer = undefined
  }
}
function mousedownShortcutListener(event) {
  if (performance.now() - lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
    return
  }
  const linkElement = event.target.closest('a')
  if (event.which > 1 || event.metaKey || event.ctrlKey) {
    return
  }
  if (!linkElement) {
    return
  }
  linkElement.addEventListener('click', function (event) {
    if (event.detail == 1337) {
      return
    }
    event.preventDefault()
  }, {capture: true, passive: false, once: true})
  const customEvent = new MouseEvent('click', {view: window, bubbles: true, cancelable: false, detail: 1337})
  linkElement.dispatchEvent(customEvent)
}
function isPreloadable(linkElement){if(!linkElement||!linkElement.href){return}
if(useWhitelist&&!('instant' in linkElement.dataset)){return}
if(!allowExternalLinks&&linkElement.origin!=location.origin&&!('instant' in linkElement.dataset)){return}
if(!['http:','https:'].includes(linkElement.protocol)){return}
if(linkElement.protocol=='http:'&&location.protocol=='https:'){return}
if(!allowQueryString&&linkElement.search&&!('instant' in linkElement.dataset)){return}
if(linkElement.hash&&linkElement.pathname+linkElement.search==location.pathname+location.search){return}
if('noInstant' in linkElement.dataset){return}
return!0}function preload(url) {if (prefetches.has(url)) {return}const prefetcher = document.createElement('link');prefetcher.rel = 'prefetch';prefetcher.href = url;document.head.appendChild(prefetcher);prefetches.add(url);$.ajax({type: "GET",dataType: 'html',contentType: "text/html; charset=utf-8",url: url,cache: true,async: true});}
