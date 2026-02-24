/**
 * Frontend page: SecuritySection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { Shield, Lock, Globe, Award } from "lucide-react";

/**
 * SecuritySection Component
 * 
 * This component displays the security and trust section of the homepage.
 * It showcases the security features and certifications of the platform
 * with a dark gradient background and professional security icons.
 * 
 * Features:
 * - Dark gradient background for emphasis
 * - Four security features with icons
 * - Responsive grid layout
 * - Professional security-focused design
 * 
 * @returns {JSX.Element} Security section component
 */
const SecuritySection = () => {
  // Security features data
  const securityFeatures = [
    {
      icon: Lock,
      title: "HIPAA Compliant",
      description: "Full compliance with healthcare privacy regulations",
      iconColor: "text-blue-300"
    },
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Military-grade encryption for all data transmission",
      iconColor: "text-emerald-300"
    },
    {
      icon: Globe,
      title: "Global Standards",
      description: "ISO 27001 certified security management",
      iconColor: "text-purple-300"
    },
    {
      icon: Award,
      title: "Medical Grade",
      description: "FDA-approved AI algorithms and processes",
      iconColor: "text-yellow-300"
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
      <div className="container mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Security Badge */}
          <div className="bg-white/20 text-white border border-white/30 px-6 py-2 text-lg mb-6 rounded-full inline-flex items-center backdrop-blur-sm">
            <Shield className="w-5 h-5 mr-2" />
            Enterprise-Grade Security
          </div>
          
          {/* Main Heading */}
          <h2 className="text-5xl font-bold mb-6">
            Your Health Data is Safe & Secure
          </h2>
          
          {/* Description */}
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            We employ the highest standards of security and privacy protection to ensure your medical information remains confidential and secure.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {securityFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                {/* Feature Icon */}
                <IconComponent className={`w-12 h-12 mx-auto mb-4 ${feature.iconColor}`} />
                
                {/* Feature Title */}
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                
                {/* Feature Description */}
                <p className="text-blue-100">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;