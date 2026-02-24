/**
 * Frontend page: Pricing
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import CTASection from "../CTASection/CTASection";
import FAQSection from "../FAQSection/FAQSection";
import PricingCards from "../PricingCards/PricingCards";

const Pricing = () => {
    return (
        <div>
            <PricingCards />
            <FAQSection />
            <CTASection />
        </div>
    );
};

export default Pricing;