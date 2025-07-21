import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isTouch, setIsTouch] = React.useState<boolean>(false)
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const orientationMql = window.matchMedia("(orientation: portrait)")
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      setOrientation(orientationMql.matches ? 'portrait' : 'landscape')
    }

    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    mql.addEventListener("change", onChange)
    orientationMql.addEventListener("change", onChange)
    
    onChange()
    checkTouch()

    return () => {
      mql.removeEventListener("change", onChange)
      orientationMql.removeEventListener("change", onChange)
    }
  }, [])

  return {
    isMobile: !!isMobile,
    isTouch,
    orientation
  }
}
