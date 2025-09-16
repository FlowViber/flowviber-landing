import LandingPage from "@/components/landing/landing-page"

export default function Home() {
  console.log("[v0] Home component rendering...")
  console.log("[v0] Window dimensions:", typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : 'Server side')

  // Always show landing page at root path - Enable SSR
  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'auto' }}>
      <LandingPage />
    </div>
  )
}