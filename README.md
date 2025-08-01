# Stable Story Hub

A comprehensive horse management application built with React, TypeScript, and Supabase. Manage your horse inventory, track health records, competitions, and more with a beautiful, modern interface.

## Features

- 🐎 **Horse Management** - Complete CRUD operations for horse profiles
- 🔐 **Authentication** - Secure user authentication with Supabase Auth
- 📊 **Health Tracking** - Vaccination records, vet checks, and health status
- 🏆 **Competition History** - Track performance and achievements
- 📸 **Media Management** - Upload and organize horse photos and videos
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui and Tailwind CSS
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔒 **Row Level Security** - Data protection with Supabase RLS
- ⚡ **Real-time Updates** - Instant data synchronization

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd hds-horses
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up Supabase:**
   - Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md)
   - Create a `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser and navigate to `http://localhost:5173`**

## Database Schema

The application uses the following main tables:

- **horses** - Main horse profiles with all basic information
- **horse_images** - Horse photos with captions and primary image flags
- **horse_videos** - Horse videos with thumbnails and captions
- **competitions** - Competition history and results

All tables are protected with Row Level Security (RLS) to ensure users can only access their own data.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── CreateHorseForm.tsx
│   ├── EditHorseForm.tsx
│   ├── HorseCard.tsx
│   ├── HorseGallery.tsx
│   ├── MediaUpload.tsx
│   ├── ShareHorse.tsx
│   ├── UserProfile.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and Supabase config
├── pages/              # Page components
│   ├── Index.tsx
│   ├── HorseDetail.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── ForgotPassword.tsx
│   └── NotFound.tsx
├── services/           # API services
│   └── horseService.ts
├── types/              # TypeScript type definitions
│   └── horse.ts
└── assets/             # Static assets
```

## Key Features

### Authentication
- Email/password authentication
- Password reset functionality
- Protected routes
- User session management

### Horse Management
- Create, read, update, delete horse profiles
- Comprehensive horse information tracking
- Health record management
- Training and competition history
- Media upload and management

### Data Security
- Row Level Security (RLS) policies
- User-specific data isolation
- Secure API endpoints
- Environment variable protection

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

Build the project and deploy the `dist` folder:

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

If you encounter any issues:

1. Check the [Supabase Setup Guide](./SUPABASE_SETUP.md)
2. Ensure your environment variables are correctly set
3. Verify your database schema is properly configured
4. Check the browser console for error messages

## License

This project is licensed under the MIT License.
