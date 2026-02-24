/**
 * Frontend page: BrandSection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { Link } from 'react-router-dom';
import React from 'react';

const BrandSection = () => {
  return (
    <div className="branding-section">
      <div className="logo-section">
        <div className="logo-container">
          <Link to="/" className="logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div className="logo-badge"></div>
        </div>
        <Link to="/" className="logo-text">
          <h1 className="company-name">ShasthoAI</h1>
          <div className="company-tagline">TELEMEDICINE PLATFORM</div>
        </Link>
      </div>

      <div className="hero-section">
        <h1 className="hero-title">
          Join the Future of<br />
          <span className="hero-highlight">Healthcare Today</span>
        </h1>
        <p className="hero-description">
          Get instant access to AI-powered medical consultations, health monitoring, and comprehensive healthcare management tools.
        </p>
      </div>

      <div className="features-section">
        <div className="feature-card feature-free">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="feature-content">
            <h3>Free AI Consultations</h3>
            <p>5 free AI medical consultations monthly</p>
          </div>
          <span className="feature-badge free">FREE</span>
        </div>

        <div className="feature-card feature-secure">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="feature-content">
            <h3>HIPAA Compliant</h3>
            <p>Enterprise-grade security & privacy</p>
          </div>
          <span className="feature-badge secure">SECURE</span>
        </div>

        <div className="feature-card feature-premium">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="feature-content">
            <h3>Health Dashboard</h3>
            <p>Comprehensive health tracking & analytics</p>
          </div>
          <span className="feature-badge premium">PREMIUM</span>
        </div>
      </div>

      <div className="offer-section">
        <div className="offer-header">
          <div className="offer-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="offer-text">
            <h3>Limited Time Offer</h3>
            <p>Get 30 days of premium features free</p>
          </div>
        </div>
        <div className="offer-details">
          <span className="offer-badge">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            $0 for 30 days
          </span>
          <span className="offer-note">Then $9.99/month</span>
        </div>
      </div>
    </div>
  );
};

export default BrandSection;