export const isElementInView = selector => {
    const element = document.querySelector( selector )
    if (!element) return false
    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const topInView = rect.top > 0 && rect.top < viewportHeight
    const bottomInView = rect.bottom > 0 && rect.bottom < viewportHeight
    const topIsAboveViewportTop = rect.top <= 0
    const bottomIsBelowViewportBottom = rect.bottom >= viewportHeight
    return topInView || bottomInView || ( topIsAboveViewportTop && bottomIsBelowViewportBottom )
}