================================================================================
                        BREWCRAFT RESTAURANT & CAFE SYSTEM
================================================================================

PROJECT OVERVIEW
--------------------------------------------------------------------------------
BrewCraft is a comprehensive cloud-based restaurant and cafe management system
built with modern web technologies and deployed on AWS infrastructure. The 
system provides a full-featured web application for restaurant operations 
including table booking, menu management, user authentication, and real-time 
customer-admin chat functionality.

SYSTEM URL
--------------------------------------------------------------------------------
Production Application (Custom Domain):
https://brewcraft.rocks

Production Application Load Balancer (ALB):
http://dev-brewcraft-alb-852606234.us-east-1.elb.amazonaws.com

API Gateway Endpoint:
https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com

TECHNOLOGY STACK
--------------------------------------------------------------------------------
Frontend:
  - React 18.2.0 (Create React App)
  - Tailwind CSS 3.4.1 (Styling framework)
  - React Router DOM 6.20.0 (Client-side routing)
  - Radix UI (Accessible component primitives)
  - Lucide React (Icon library)

Backend & Cloud Infrastructure:
  - AWS Cognito (User authentication & authorization)
  - AWS Lambda (Serverless backend functions)
  - AWS DynamoDB (NoSQL database)
  - AWS API Gateway (RESTful API management)
  - AWS Application Load Balancer (Traffic distribution)
  - AWS EC2 (Container hosting)
  - Docker (Containerization)

Key Libraries:
  - amazon-cognito-identity-js (Authentication)
  - aws-sdk (AWS service integration)
  - jwt-decode (Token handling)
  - crypto-js (Encryption utilities)
  - uuid (Unique identifier generation)

SYSTEM ARCHITECTURE
--------------------------------------------------------------------------------
The BrewCraft system follows a modern serverless architecture:

1. Frontend Layer:
   - React SPA (Single Page Application)
   - Responsive design with Tailwind CSS
   - Client-side routing and state management
   - Deployed in Docker containers on EC2

2. Authentication Layer:
   - AWS Cognito User Pools for user management
   - JWT-based authentication
   - Role-based access control (Customer/Admin)

3. API Layer:
   - AWS API Gateway for RESTful endpoints
   - AWS Lambda functions for business logic
   - WebSocket support for real-time features

4. Data Layer:
   - AWS DynamoDB for persistent storage
   - Tables: USERS_TABLE, bookings, menu items, chat messages

5. Load Balancing:
   - Application Load Balancer for high availability
   - Health checks and auto-scaling capabilities

CORE FEATURES
--------------------------------------------------------------------------------
1. User Authentication & Authorization:
   - User registration with email verification
   - Secure login/logout functionality
   - Role-based access (Customer/Admin)
   - Password reset and account management

2. Table Booking System:
   - Real-time table availability checking
   - Smart capacity validation
   - Booking confirmation and management
   - Admin booking approval workflow

3. Menu Management:
   - Dynamic menu display
   - Category-based organization
   - Admin menu item management

4. Customer-Admin Chat:
   - Real-time messaging system
   - Conversation history
   - Admin dashboard for customer support

5. User Profile Management:
   - Profile information editing
   - Avatar upload functionality
   - Booking history tracking

AWS CONFIGURATION
--------------------------------------------------------------------------------
Region: us-east-1 (US East - N. Virginia)

Cognito Configuration:
  - User Pool ID: us-east-1_phpgibZJD
  - Client ID: 10g093m0qo9fj9hsar5ngtp8ej
  - Authentication Flow: USER_PASSWORD_AUTH

API Endpoints:
  - Custom Domain: http://brewcraft.rocks
  - ALB URL: http://dev-brewcraft-alb-852606234.us-east-1.elb.amazonaws.com
  - API Gateway: https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com

DynamoDB Tables:
  - USERS_TABLE (User profiles and metadata)
  - Additional tables for bookings, menu, chat messages

DEPLOYMENT ARCHITECTURE
--------------------------------------------------------------------------------
The application is containerized using Docker and deployed on AWS:

1. Docker Container:
   - Base Image: node:18-alpine
   - Working Directory: /app
   - Exposed Port: 3000
   - Production-optimized build

2. EC2 Deployment:
   - Containers running on EC2 instances
   - Behind Application Load Balancer
   - Auto-scaling configuration

3. CI/CD Pipeline:
   - GitHub Actions for automated deployment
   - Docker image building and pushing
   - EC2 container updates

LOCAL DEVELOPMENT SETUP
--------------------------------------------------------------------------------
Prerequisites:
  - Node.js >= 16.x
  - npm or pnpm package manager
  - Git for version control

Installation Steps:
  1. Clone the repository:
     git clone <repository-url>
     cd cloud-developing-group

  2. Install dependencies:
     npm install

  3. Configure environment variables:
     - Copy .env.example to .env (if available)
     - Update AWS credentials and endpoints

  4. Start development server:
     npm start

  5. Access the application:
     Open http://localhost:3000 in your browser

Build for Production:
  npm run build
  
  The optimized production build will be created in the build/ folder.

DOCKER DEPLOYMENT
--------------------------------------------------------------------------------
Build Docker Image:
  docker build -t brewcraft-app .

Run Docker Container:
  docker run -p 3000:3000 brewcraft-app

The application will be available at http://localhost:3000

PROJECT STRUCTURE
--------------------------------------------------------------------------------
cloud-developing-group/
├── public/                 # Static assets (icons, index.html, manifest)
├── src/
│   ├── app/               # Application pages and layouts
│   ├── components/        # Reusable React components
│   │   ├── Header         # Navigation header
│   │   ├── Footer         # Page footer
│   │   ├── Chatbox        # Real-time chat component
│   │   └── UI primitives  # Base UI components
│   ├── pages/             # Main application pages
│   │   ├── Booking.jsx    # Table booking interface
│   │   ├── Menu           # Menu display
│   │   ├── Profile        # User profile management
│   │   └── Admin          # Admin dashboard
│   ├── lib/               # Utility functions and helpers
│   ├── constants/         # Application constants
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application styles
│   ├── index.js           # Application entry point
│   └── index.css          # Global styles
├── dockerfile             # Docker configuration
├── package.json           # Project dependencies
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── .env                   # Environment variables (not in version control)
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation

SECURITY CONSIDERATIONS
--------------------------------------------------------------------------------
1. Authentication:
   - AWS Cognito provides secure user authentication
   - JWT tokens for session management
   - Automatic token refresh mechanisms

2. API Security:
   - API Gateway with request validation
   - Lambda authorizers for protected endpoints
   - CORS configuration for cross-origin requests

3. Data Protection:
   - Encrypted data transmission (HTTPS)
   - DynamoDB encryption at rest
   - Secure credential management via environment variables

4. Best Practices:
   - Never commit .env files to version control
   - Rotate AWS credentials regularly
   - Use IAM roles with least privilege principle
   - Regular security audits and updates

TESTING
--------------------------------------------------------------------------------
Run Tests:
  npm test

The project uses React Testing Library for component testing.

TROUBLESHOOTING
--------------------------------------------------------------------------------
Common Issues:

1. Build Errors:
   - Clear node_modules and reinstall: rm -rf node_modules && npm install
   - Clear build cache: rm -rf build

2. Authentication Issues:
   - Verify Cognito configuration in .env
   - Check AWS credentials validity
   - Ensure user pool and client IDs are correct

3. API Connection Issues:
   - Verify API Gateway endpoint URLs
   - Check CORS configuration
   - Validate AWS region settings

4. Docker Issues:
   - Ensure Docker daemon is running
   - Check port 3000 availability
   - Verify Dockerfile configuration

CONTRIBUTING
--------------------------------------------------------------------------------
Development Guidelines:
  - Keep components small and focused
  - Follow React best practices and hooks patterns
  - Use Tailwind CSS utility classes for styling
  - Place static assets in public/ for fixed URLs
  - Import images from src/assets for bundled assets
  - Write meaningful commit messages
  - Test changes before pushing

Code Style:
  - ESLint configuration via react-scripts
  - Consistent component structure
  - Proper prop-types or TypeScript (if applicable)

MAINTENANCE & SUPPORT
--------------------------------------------------------------------------------
For system maintenance, monitoring, and support:
  - Monitor AWS CloudWatch for application logs
  - Check ALB health checks and target group status
  - Review DynamoDB metrics for performance
  - Monitor Cognito user pool activity
  - Regular dependency updates via npm audit

CONTACT & DOCUMENTATION
--------------------------------------------------------------------------------
For additional documentation, please refer to:
  - README.md (Markdown version)
  - AWS Console for infrastructure details
  - API Gateway documentation for endpoint specifications
  - Lambda function logs in CloudWatch

PROJECT STATUS
--------------------------------------------------------------------------------
Version: 1.0.0
Status: Production
Last Updated: January 2026
Deployment: AWS Cloud Infrastructure

================================================================================
                              END OF DOCUMENT
================================================================================
