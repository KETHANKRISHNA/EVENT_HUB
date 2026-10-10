import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-primary/5 py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            Discover & Host <span className="text-primary">Amazing Events</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            The all-in-one platform for ticketing, seating, and managing events seamlessly. Build for attendees and organizers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/events" />} nativeButton={false}>
              Explore Events
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/signup" />} nativeButton={false}>
              Create an Event
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Section placeholder */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Popular Events Near You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Skeletons/Placeholders for now */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-4 text-left h-64 flex flex-col justify-end">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                <div className="flex justify-between items-center mt-auto">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
