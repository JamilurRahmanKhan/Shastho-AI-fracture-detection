/**
 * Frontend page: Banner
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

/**
 * The Banner component in this JavaScript React code displays information about an AI-powered
 * healthcare platform with interactive elements like buttons and trust indicators.
 * @returns The `Banner` component is being returned. It is a functional component in React that
 * displays a banner section with various elements such as headings, descriptions, buttons, and trust
 * indicators related to an AI-powered healthcare platform. The component uses state and effects hooks
 * from React to handle the loading animation and content display. The banner includes styled elements
 * like gradients, icons, and responsive layouts to create an engaging user interface
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Brain, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

const Banner = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="py-20 px-6 bg-[#F9FBFC]">
            <div className="container mx-auto text-center">
                <div
                    className={`transition-all duration-1000 ${
                        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
                >
                    {/* Badge */}
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-6 py-2 text-lg mb-8 rounded-full inline-flex items-center">
                        <Sparkles className="w-5 h-5 mr-2" />
                        AI-Powered Healthcare Revolution
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-8 leading-tight">
                        Your Personal
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            AI Medical Assistant
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                        Experience the future of healthcare with our advanced AI platform. Get instant medical consultations,
                        analyze symptoms, interpret medical images, and connect with healthcare professionals – all in one place.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
                        <Link
                            to="/signup"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 text-white text-lg px-8 py-4 rounded-2xl inline-flex items-center font-medium"
                        >
                            <Brain className="w-6 h-6 mr-3" />
                            Start Free Consultation
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        
                        <Link
                            to="/chat"
                            className="border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 text-lg px-8 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl inline-flex items-center font-medium transition-all duration-300"
                        >
                            <MessageCircle className="w-6 h-6 mr-3" />
                            Try AI Demo
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600 mb-2">500K+</div>
                            <div className="text-slate-600 font-medium">Patients Served</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-600 mb-2">98.5%</div>
                            <div className="text-slate-600 font-medium">Accuracy Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                            <div className="text-slate-600 font-medium">AI Availability</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-orange-600 mb-2">2M+</div>
                            <div className="text-slate-600 font-medium">Analyses Completed</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Banner;







// Alternative Design
// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { Brain, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

// const Banner = () => {
//     const [isLoaded, setIsLoaded] = useState(false);

//     useEffect(() => {
//         setIsLoaded(true);
//     }, []);

//     return (
//         <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
//             <div className="container mx-auto text-center">
//                 <div
//                     className={`transition-all duration-1000 ${
//                         isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
//                     }`}
//                 >
//                     {/* Badge */}
//                     <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-200 border border-blue-400/30 px-6 py-2 text-lg mb-8 rounded-full inline-flex items-center backdrop-blur-sm">
//                         <Sparkles className="w-5 h-5 mr-2" />
//                         AI-Powered Healthcare Revolution
//                     </div>

//                     {/* Main Heading */}
//                     <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
//                         Your Personal
//                         <br />
//                         <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
//                             AI Medical Assistant
//                         </span>
//                     </h1>

//                     {/* Description */}
//                     <p className="text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
//                         Experience the future of healthcare with our advanced AI platform. Get instant medical consultations,
//                         analyze symptoms, interpret medical images, and connect with healthcare professionals – all in one place.
//                     </p>

//                     {/* Buttons */}
//                     <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
//                         <Link
//                             to="/signup"
//                             className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 text-lg px-8 py-4 rounded-2xl inline-flex items-center font-medium"
//                         >
//                             <Brain className="w-6 h-6 mr-3" />
//                             Start Free Consultation
//                             <ArrowRight className="w-5 h-5 ml-2" />
//                         </Link>
                        
//                         <Link
//                             to="/chat"
//                             className="border-2 border-white/30 hover:border-white hover:bg-white/10 text-white text-lg px-8 py-4 rounded-2xl bg-transparent backdrop-blur-sm shadow-xl inline-flex items-center font-medium transition-all duration-300"
//                         >
//                             <MessageCircle className="w-6 h-6 mr-3" />
//                             Try AI Demo
//                         </Link>
//                     </div>

//                     {/* Trust Indicators */}
//                     <div className="grid md:grid-cols-4 gap-8">
//                         <div className="text-center">
//                             <div className="text-4xl font-bold text-white mb-2">500K+</div>
//                             <div className="text-blue-200 font-medium">Patients Served</div>
//                         </div>
//                         <div className="text-center">
//                             <div className="text-4xl font-bold text-white mb-2">98.5%</div>
//                             <div className="text-blue-200 font-medium">Accuracy Rate</div>
//                         </div>
//                         <div className="text-center">
//                             <div className="text-4xl font-bold text-white mb-2">24/7</div>
//                             <div className="text-blue-200 font-medium">AI Availability</div>
//                         </div>
//                         <div className="text-center">
//                             <div className="text-4xl font-bold text-white mb-2">2M+</div>
//                             <div className="text-blue-200 font-medium">Analyses Completed</div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// };

// export default Banner;