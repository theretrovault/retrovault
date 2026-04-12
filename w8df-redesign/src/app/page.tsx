import { CalendarDays, MapPin, Radio, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white py-24 shadow-xl">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-md">
            Welcome to <span className="text-yellow-400">W8DF</span>
          </h2>
          <p className="text-xl md:text-2xl font-light mb-8 opacity-90">
            Southern Michigan Amateur Radio Society
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#hamfest" className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-3 px-8 rounded-full text-lg transition-all shadow-lg transform hover:scale-105">
              Hamfest 2026 - Get Your Tickets!
            </a>
            <a href="#meetings" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-bold py-3 px-8 rounded-full text-lg transition-all shadow-lg transform hover:scale-105">
              Join a Meeting
            </a>
          </div>
        </div>
      </section>

      {/* Hamfest Countdown */}
      <section id="hamfest" className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16 shadow-inner">
        <div className="container mx-auto px-8 text-center">
          <h3 className="text-4xl font-bold mb-6 text-yellow-400 tracking-wide">Crossroads Hamfest 2026</h3>
          <p className="text-2xl mb-8 opacity-90">Only <span className="text-yellow-500 font-bold">22 days</span> until the biggest event of the year!</p>
          <p className="text-lg max-w-2xl mx-auto mb-8">
            This year we&apos;re at a brand new location: <strong className="text-white">Calhoun County Fairgrounds</strong>. 
            Expect a full house, so secure your tables early. Fantastic door prizes await!
          </p>
          <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all shadow-md transform hover:scale-105">
            Vendor Info & Tickets
          </a>
          <div className="mt-10 p-6 bg-slate-700 rounded-lg shadow-md max-w-xl mx-auto">
            <p className="text-xl font-semibold mb-2">Event Schedule:</p>
            <ul className="text-lg text-left inline-block">
              <li><strong className="text-slate-300">Saturday, May 2nd:</strong> Doors open to public at 8:00 AM</li>
              <li><strong className="text-slate-300">Friday, May 1st:</strong> Vendor setup 6:00 PM - 9:00 PM</li>
              <li><strong className="text-slate-300">Saturday, May 2nd:</strong> Vendor setup 6:00 AM - 8:00 AM</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Meetings Section */}
      <section id="meetings" className="py-20 bg-slate-100">
        <div className="container mx-auto px-8">
          <h3 className="text-4xl font-bold text-blue-900 mb-12 text-center">Club Meetings & Gatherings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Monthly Meeting */}
            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4 text-blue-700">
                <CalendarDays size={32} />
                <h4 className="text-3xl font-bold">Monthly Meeting</h4>
              </div>
              <p className="text-lg text-slate-700 mb-4">
                Join us on the <strong className="font-semibold">3rd Thursday of every month</strong> at Maple United Methodist Church. Meetings begin at <strong className="font-semibold">7:00 PM</strong> and are a great way to connect with the SMARS community.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 mt-4">
                <MapPin size={20} /> View Map
              </a>
            </div>

            {/* Social Gatherings */}
            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-yellow-500 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4 text-yellow-600">
                <Users size={32} />
                <h4 className="text-3xl font-bold">Social Gatherings</h4>
              </div>
              <ul className="text-lg text-slate-700 space-y-3">
                <li><strong className="font-semibold text-slate-800">2nd Saturday:</strong> SMARS Club Breakfast (8:30 AM) at Coney Island.</li>
                <li><strong className="font-semibold text-slate-800">1st Thursday:</strong> BLB (Before Lunch Bunch) at Coney Island (11:30 AM).</li>
                <li><strong className="font-semibold text-slate-800">1st Saturday (after siren test):</strong> Coffee at Coney Island.</li>
              </ul>
              <p className="text-blue-600 text-lg mt-6">New members and interested individuals are always welcome!</p>
            </div>
          </div>
        </div>
      </section>

      {/* VE Testing Section */}
      <section id="testing" className="py-20 bg-blue-50">
        <div className="container mx-auto px-8 text-center">
          <h3 className="text-4xl font-bold text-blue-900 mb-10">Become an Amateur Radio Operator!</h3>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-10">
            Interested in joining the exciting world of Ham Radio? SMARS offers regular 
            <strong className="font-semibold text-blue-800">VE (Volunteer Examiner) Sessions</strong> to help you pass your licensing exam.
          </p>
          <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-xl border-b-4 border-emerald-500">
            <h4 className="text-3xl font-bold text-emerald-700 mb-6">Upcoming VE Sessions:</h4>
            <ul className="space-y-4 text-xl text-slate-700">
              <li className="flex items-center justify-between border-b pb-2 border-slate-200"><span className="font-semibold">April 23, 2026:</span> 7 PM, Maple UMC</li>
              <li className="flex items-center justify-between border-b pb-2 border-slate-200"><span className="font-semibold">May 2, 2026:</span> 10 AM, SMARS Hamfest</li>
              <li className="flex items-center justify-between border-b pb-2 border-slate-200"><span className="font-semibold">June 25, 2026:</span> 7 PM, Maple UMC</li>
              <li className="flex items-center justify-between border-b pb-2 border-slate-200"><span className="font-semibold">August 27, 2026:</span> 7 PM, Maple UMC</li>
            </ul>
            <p className="text-blue-600 text-lg mt-8">Walk-ins are always welcome!</p>
          </div>
        </div>
      </section>

      {/* About Section - Placeholder */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="container mx-auto px-8 text-center">
          <h3 className="text-4xl font-bold text-blue-900 mb-10">About SMARS</h3>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            The Southern Michigan Amateur Radio Society (SMARS) is a vibrant community of ham radio enthusiasts 
            dedicated to promoting the art and science of amateur radio. We provide resources for licensing, 
            host regular meetings, social events, and participate in community service. Whether you&apos;re a seasoned 
            operator or just curious about getting started, you&apos;ll find a welcoming home at SMARS.
          </p>
          <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold mt-8 inline-block">Learn More About Us &rarr;</a>
        </div>
      </section>

    </div>
  );
}
