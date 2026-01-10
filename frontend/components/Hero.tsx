export default function Hero() {
    return (
        <div className="min-h-screen bg-white">
            <section className="relative pt-28 sm:pt-32 pb-8 overflow-hidden">
                {/* Floating Decorative Elements */}
                <div className="absolute top-40 left-10 w-4 h-4 bg-primary-400 rounded-full animate-float opacity-60 hidden sm:block" />
                <div className="absolute top-60 right-20 w-3 h-3 bg-accent-yellow rounded-full animate-float-slow opacity-70 hidden sm:block" />
                <div className="absolute top-48 right-40 w-2 h-2 bg-accent-orange rounded-full animate-float-delayed opacity-50 hidden sm:block" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main Headline */}
                    <div className="max-w-4xl">
                        <h1 className="text-5xl sm:text-5xl md:text-5xl lg:text-5xl xl:text-6xl font-display font-semibold leading-[1.1] tracking-tight text-gray-900">
                            Where Campuses Compete and Champions Claim the Prize
                        </h1>
                        <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
                            Join XIANZE 2K26 — the ultimate inter-collegiate tech symposium. Compete,
                            collaborate, and showcase your skills across coding, design, and innovation challenges.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <a
                            href="/register"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-full shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Register Now
                        </a>
                        <a
                            href="/events"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-800 font-semibold rounded-full hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Explore Events
                        </a>
                    </div>

                    {/* Circular Badge - Hidden on mobile */}
                    <div className="absolute right-4 sm:right-8 lg:right-20 top-48 sm:top-64 lg:top-72 hidden sm:block">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
                            <div className="absolute inset-0 rounded-full bg-gray-900 flex items-center justify-center shadow-2xl">
                                <div className="text-white">
                                    <svg
                                        className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Rotating text around badge */}
                            <svg
                                className="absolute inset-0 w-full h-full animate-spin-slow"
                                viewBox="0 0 100 100"
                            >
                                <defs>
                                    <path
                                        id="circlePath"
                                        d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                                    />
                                </defs>
                                <text fontSize="9" fill="#ffffff" fontWeight="600" letterSpacing="2">
                                    <textPath href="#circlePath">
                                        XIANZE • 2K26 • XIANZE • 2K26 • XIANZE • 2K26 •
                                    </textPath>
                                </text>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Hero Video Section - Responsive */}
                <div className="mt-10 sm:mt-12 mx-4 sm:mx-6 lg:mx-8">
                    <div className="relative w-full overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl">
                        {/* Responsive aspect ratio: 9:16 on mobile, 16:9 on desktop */}
                        <div className="relative w-full aspect-[9/14] sm:aspect-[16/10] lg:aspect-video">
                            <video
                                className="absolute inset-0 w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                <source
                                    src="https://framerusercontent.com/modules/assets/dIzxOpo2vafKbdKB2yyZi8bt5o~CwtI99P76DbvF7z19Hr01mXKUlQXrWPBySz_UaKKHqY.mp4"
                                    type="video/mp4"
                                />
                                Your browser does not support the video tag.
                            </video>
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

                            {/* Play indicator on mobile */}
                            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                LIVE PREVIEW
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}