# Tech Stack

## Frontend
- React 19
- TypeScript
- Vite

## UI & Styling
- Radix UI
- Tailwind CSS
- shadcn/ui

## Backend & Database
- Supabase
  - PostgreSQL
  - Authentication
  - Storage
  - Row Level Security (RLS)

### AWS Migration Alternative
If migrated to AWS, the backend would use:
- **Amazon RDS PostgreSQL** or **Amazon Aurora PostgreSQL** (database)
- **Amazon Cognito** (user authentication & authorization)
- **Amazon S3** (file storage for images, videos, documents)
- **AWS Lambda** (serverless API functions)
- **Amazon API Gateway** (REST API endpoints)
- **AWS IAM** (access control policies)
- **Amazon CloudFront** (CDN for static assets)

**Additional considerations:**
- RLS logic would move to Lambda authorizers or application-level permissions
- Custom API layer required (currently handled by Supabase auto-generated APIs)
- Infrastructure as Code with AWS CDK or Terraform
- Potential cost savings at scale vs Supabase pricing

## State Management
- React Context API
- TanStack Query (React Query)

## Routing
- React Router v6

## Security
- bcryptjs (password hashing)

## Deployment
- Vercel

## Development Tools
- TypeScript
- ESLint
- Git/GitHub
