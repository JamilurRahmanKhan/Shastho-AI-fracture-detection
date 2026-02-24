/**
 * Frontend: NoLayout
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

// src/layouts/NoLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const NoLayout = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default NoLayout;