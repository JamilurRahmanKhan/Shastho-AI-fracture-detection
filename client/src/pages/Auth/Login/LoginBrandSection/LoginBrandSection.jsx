/**
 * Frontend page: LoginBrandSection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Link } from 'react-router-dom';

const LoginBrandSection = () => {
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
          Welcome Back to
          <br />
          <span className="hero-highlight">Advanced Healthcare</span>
        </h1>
        <p className="hero-description">
          Access your personalized health dashboard, AI consultations, and comprehensive medical management tools.
        </p>
      </div>

      <div className="features-section">
        <div className="feature-card feature-ai">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="feature-content">
            <h3>AI Medical Assistant</h3>
            <p>24/7 instant consultations</p>
          </div>
        </div>

        <div className="feature-card feature-telemedicine">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="feature-content">
            <h3>Telemedicine Platform</h3>
            <p>Connect with licensed doctors</p>
          </div>
        </div>

        <div className="feature-card feature-monitoring">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="feature-content">
            <h3>Health Monitoring</h3>
            <p>Comprehensive health tracking</p>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">500K+</div>
          <div className="stat-label">Patients Served</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">98.5%</div>
          <div className="stat-label">Accuracy Rate</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">AI Available</div>
        </div>
      </div>
    </div>
  );
};

export default LoginBrandSection;