import Link from "next/link"
import Image from "next/image"

import { HubCard } from "@/components/HubCard"
import { hubs, marketplaceStats } from "@/lib/hubs"

const formatKrw = new Intl.NumberFormat("ko-KR")

const generatedStories = [
  {
    title: "Route handoffs through a trusted cafe.",
    summary: "Apartment, delivery courier, cafe shelf, and commuter pickup become one simple flow.",
    imageSrc: "/generated/neighborhood-route-map.png",
    alt: "Isometric route showing a parcel moving from an apartment to a cafe pickup point",
  },
  {
    title: "Make security visible before pickup.",
    summary: "Cubbies, staff visibility, and abstract code checks help each parcel feel accounted for.",
    imageSrc: "/generated/secure-pickup-cubbies.png",
    alt: "Secure cafe parcel cubbies with a customer showing an abstract pickup code",
  },
  {
    title: "Turn spare shelf space into cafe upside.",
    summary: "Hosts can see shelf capacity, recurring pickup demand, and extra foot traffic in one place.",
    imageSrc: "/generated/host-revenue-dashboard.png",
    alt: "Cafe owner viewing an abstract dashboard beside parcel shelves",
  },
  {
    title: "Let a trusted friend pick up instead.",
    summary: "Delegated pickup permissions make neighborhood handoffs flexible without losing control.",
    imageSrc: "/generated/friend-authorized-pickup.png",
    alt: "Friend showing an abstract permission screen during a cafe parcel pickup",
  },
] as const

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Primary">
          <Link href="/" className="brand" aria-label="Cafe Pickup Hub home">
            <span className="brand__mark">CPH</span>
            <span>Cafe Pickup Hub</span>
          </Link>
          <div className="nav__links">
            <a href="#explore">Explore</a>
            <a href="#hosts">For cafes</a>
          </div>
        </nav>

        <div className="hero__content">
          <div className="hero__copy">
            <p className="eyebrow">Neighborhood pickup space marketplace</p>
            <h1>Turn trusted cafes into safe pickup hubs.</h1>
            <p className="hero__lead">
              Cafe Pickup Hub helps cafes rent spare counter, cubby, and shelf capacity for
              low-friction marketplace handoffs.
            </p>
            <div className="hero__actions">
              <a href="#explore" className="button button--primary">
                Browse hubs
              </a>
              <a href="#hosts" className="button button--secondary">
                List cafe space
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <Image
              src="/generated/hero-cafe-pickup-hub.png"
              alt="Barista handing a package to a commuter at a warm cafe pickup counter"
              width={1672}
              height={941}
              priority
            />
            <div className="hero-visual__ticket">
              <span>Verified handoff</span>
              <strong>Staff-watched shelf</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Marketplace snapshot">
        <div>
          <strong>{marketplaceStats.activeHubs}</strong>
          <span>seed hubs</span>
        </div>
        <div>
          <strong>{marketplaceStats.totalSlots}</strong>
          <span>daily parcel slots</span>
        </div>
        <div>
          <strong>{formatKrw.format(marketplaceStats.lowestPrice)}</strong>
          <span>KRW starter price</span>
        </div>
      </section>

      <section className="explore" id="explore">
        <div className="section-heading">
          <p className="eyebrow">Explore MVP inventory</p>
          <h2>Pickup-ready cafes with trust signals upfront.</h2>
        </div>
        <div className="hub-grid">
          {hubs.map((hub) => (
            <HubCard key={hub.id} hub={hub} />
          ))}
        </div>
      </section>

      <section className="story-strip" aria-label="Generated Cafe Pickup Hub product visuals">
        {generatedStories.map((story) => (
          <article key={story.imageSrc} className="story-card">
            <Image src={story.imageSrc} alt={story.alt} width={1672} height={941} />
            <div>
              <h3>{story.title}</h3>
              <p>{story.summary}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="host-band" id="hosts">
        <div>
          <p className="eyebrow">For cafe hosts</p>
          <h2>Rent capacity you already have.</h2>
          <p>
            Start with a shelf, counter zone, or numbered cubbies. The MVP keeps the first
            listing simple: hours, slot count, handoff policy, and daily price.
          </p>
        </div>
        <a href="mailto:hosts@cafepickuphub.local" className="button button--primary">
          Start hosting
        </a>
      </section>
    </main>
  )
}
