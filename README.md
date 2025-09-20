# Clear Cache - Retro Mac Journal App

A classic Mac OS-style journaling web application built with React, TypeScript, and Supabase.

## Features

- **Retro Mac Aesthetics**: Classic Mac OS-inspired UI with window chrome, monospace fonts, and pixel-perfect styling
- **Secure Authentication**: Magic link authentication via Supabase
- **Journal Management**: Create, edit, delete, and search journal entries
- **Voice-to-Text**: Browser-based speech recognition for hands-free writing
- **Admin Dashboard**: Feature flag management and user administration
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Auth, Database, RLS)
- **UI Components**: Shadcn/ui components with custom Mac styling
- **Voice Recognition**: Web Speech API
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials

4. **Configure the database**
   - Open the Supabase SQL Editor
   - Run the SQL schema from `supabase-schema.sql`
   - This will create all necessary tables, RLS policies, and triggers

5. **Set up authentication**
   - In Supabase Dashboard, go to Authentication > Settings
   - Configure your site URL for magic link redirects
   - Optionally set up email templates

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Create an admin user**
   - Sign up through the app with your email
   - In Supabase SQL Editor, run:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE user_id = 'your-user-id';
     ```
   - Find your user ID in the Supabase Auth dashboard

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:8080
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── AuthGuard.tsx   # Route protection
│   ├── LoginForm.tsx   # Authentication
│   ├── JournalEditor.tsx
│   ├── JournalFolder.tsx
│   ├── AdminPanel.tsx
│   └── MacWindow.tsx   # Mac-style window chrome
├── hooks/
│   ├── useAuth.tsx     # Authentication hook
│   └── useSpeech.tsx   # Voice recognition hook
├── lib/
│   ├── supabase.ts     # Supabase client
│   ├── database.types.ts
│   └── utils.ts
├── pages/              # Route components
└── index.css          # Global styles and design system
```

## Features

### Authentication
- Magic link authentication (no passwords required)
- Automatic profile creation on first login
- Role-based access control (user/admin)

### Journal Entries
- Rich text editing with title and content
- Voice-to-text input using browser Speech API
- Full-text search across all entries
- Sort by newest/oldest
- Auto-save drafts (planned for Iteration 2)

### Admin Features
- Feature flag management (voice_to_text, sounds, ai_reflection)
- User management and role assignment
- Global configuration

### Mac-Style UI
- Classic window chrome with title bars and close buttons
- Monospace fonts (Monaco/Menlo/Courier)
- Pixel-perfect borders and shadows
- Authentic Mac OS design language

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app is a standard Vite React application and can be deployed to any static hosting platform.

## Browser Compatibility

- **Voice Recognition**: Chrome, Edge, Safari (latest versions)
- **General App**: All modern browsers with ES2020+ support

## Iteration 2 Roadmap

- [ ] Stripe integration for subscriptions
- [ ] AI reflection features
- [ ] Enhanced Mac theming (Chicago font, system sounds)
- [ ] Client-side encryption
- [ ] Advanced admin features
- [ ] Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the GitHub issues
2. Review Supabase documentation
3. Create a new issue with detailed description

## License

MIT License - see LICENSE file for details
