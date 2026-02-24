/**
 * The function `HowItWorks` displays a section describing a three-step process for using an AI-powered
 * healthcare platform.
 * @returns The `HowItWorks` component is being returned, which contains a section with a header
 * describing the process of ShasthoAI in three steps. Each step includes an icon, title, and
 * description. The steps are displayed in a grid layout with corresponding colors and gradients.
 */
import { Zap, MessageCircle, Brain, Stethoscope } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: MessageCircle,
      title: "Describe Your Symptoms",
      description: "Chat with our AI assistant about your health concerns, upload medical images, or describe your symptoms in natural language.",
      gradient: "from-blue-600 to-indigo-600",
      numberColor: "bg-blue-600"
    },
    {
      number: "2",
      icon: Brain,
      title: "AI Analysis & Diagnosis",
      description: "Our advanced AI analyzes your information using medical databases and provides accurate assessments with confidence scores.",
      gradient: "from-emerald-600 to-teal-600",
      numberColor: "bg-emerald-600"
    },
    {
      number: "3",
      icon: Stethoscope,
      title: "Get Treatment Plan",
      description: "Receive personalized treatment recommendations, connect with doctors, and access prescription management all in one place.",
      gradient: "from-purple-600 to-pink-600",
      numberColor: "bg-purple-600"
    }
  ];

  return (
    <section className="py-20 px-6 bg-[#F9FBFC]">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 px-6 py-2 text-lg mb-6 rounded-full inline-flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Simple & Effective Process
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
            How ShasthoAI Works
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get started with AI-powered healthcare in just three simple steps. Our platform is designed for ease of use while maintaining medical-grade accuracy.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center">
                {/* Icon Circle */}
                <div className={`w-24 h-24 bg-gradient-to-r ${step.gradient} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
                  <IconComponent className="w-12 h-12 text-white" />
                </div>
                
                {/* Step Number - Now matches icon color */}
                <div className={`w-12 h-12 ${step.numberColor} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                
                {/* Step Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;