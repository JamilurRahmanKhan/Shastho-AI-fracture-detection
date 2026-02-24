/**
 * Frontend page: FeaturesSection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

/**
 * The FeaturesSection component renders a section displaying various healthcare features with
 * corresponding icons, titles, descriptions, and lists of items.
 * @returns The FeaturesSection component is being returned, which contains a section displaying
 * various healthcare features with icons, titles, descriptions, and lists of items. Each feature card
 * includes an icon, title, description, and a list of specific items related to that feature. The
 * component also includes a header section with information about the advanced AI capabilities and
 * comprehensive healthcare solutions provided by the platform.
 */
import { CheckCircle2, Target, Brain, ImageIcon, Video, Heart, Calendar, Users } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Medical Consultation",
      description: "Get instant medical advice from our advanced AI trained on millions of medical cases",
      items: [
        "24/7 instant consultations",
        "Symptom analysis & diagnosis",
        "Treatment recommendations"
      ],
      gradient: "from-blue-600 to-indigo-600"
    },
    {
      icon: ImageIcon,
      title: "Medical Image Analysis",
      description: "Upload X-rays, MRIs, and other medical images for instant AI-powered analysis",
      items: [
        "X-ray fracture detection",
        "MRI & CT scan analysis",
        "Detailed medical reports"
      ],
      gradient: "from-emerald-600 to-teal-600"
    },
    {
      icon: Video,
      title: "Telemedicine Platform",
      description: "Connect with licensed doctors through secure video calls and consultations",
      items: [
        "HD video consultations",
        "Secure & HIPAA compliant",
        "Prescription management"
      ],
      gradient: "from-purple-600 to-pink-600"
    },
    {
      icon: Heart,
      title: "Health Monitoring",
      description: "Track vital signs, medications, and health metrics with comprehensive dashboards",
      items: [
        "Real-time vital monitoring",
        "Medication reminders",
        "Health trend analysis"
      ],
      gradient: "from-orange-600 to-red-600"
    },
    {
      icon: Calendar,
      title: "Appointment Management",
      description: "Schedule and manage appointments with healthcare providers seamlessly",
      items: [
        "Smart scheduling system",
        "Automated reminders",
        "Provider network access"
      ],
      gradient: "from-yellow-600 to-orange-600"
    },
    {
      icon: Users,
      title: "Family Health Management",
      description: "Manage health records and care for your entire family in one secure platform",
      items: [
        "Multi-user support",
        "Shared medical records",
        "Family health insights"
      ],
      gradient: "from-indigo-600 to-purple-600"
    }
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200 px-6 py-2 text-lg mb-6 rounded-full inline-flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Advanced AI Capabilities
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
            Comprehensive Healthcare Solutions
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with medical expertise to provide you with
            accurate, reliable, and instant healthcare assistance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index} 
                className="bg-white border-0 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 p-6"
              >
                {/* Card Header */}
                <div className="mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-lg text-slate-600">
                    {feature.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {feature.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;