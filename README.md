# Gyld - Professional Guild App

## 🎯 App Overview

**Gyld** is a React Native app for members of professional guilds - specifically early-career tech professionals in specific cities. The app focuses on helping people create and sign up for experiences, building community and skills through various activities.

## 👥 User Types

- **Guild Members** - Early-career tech professionals (primary users)
- **Organizers** - Members with additional permissions to create and manage events
- **Admins** - App administrators with full access

**Guild Structure:** Each user belongs to a specific guild (e.g., "Seattle Product Managers") and primarily interacts with others from their guild.

## 🚀 Core User Journeys

**Primary Access:** Most user journeys begin from **deeplinks**

**Main Activities:**
- Sign up for events and experiences
- Create events (organizers)
- Sign up for classes and coaching
- Take on roles within the guild
- Explore other guild members

## 📱 Core Experiences

### **Events & Gatherings**
- Case study discussions
- Happy hours and other social events
- Class meetings

### **Learning & Development**
- **Courses** - Learning experiences and classes
- **Coaching** - Group coaching sessions


### **Community Building**
- **Teams** - Sports teams and recreational activities
- **Pods** - Podcast clubs and discussion groups
- **Lottery** - Networking service for meeting new members
- **Pro Bono** - Volunteer projects for skill building

### **Guild Roles**
- Recruiting new members
- Inducting new members
- Organizing mentoring salons
- Event organizing
- Team/pod leadership
- Organizing social events
- Serving as a scribe for mentoring salons
- Interviewing gyld mentors

## 🎨 Design System

### **Navigation Standards**
- **Bottom Navigation:** Home | Roles | Gyld | You (using Feather icons)
- **Sub-Navigation:** FacebookTopNavTabs component for all top-level sub-tabs
- **Brand Color:** #13bec7 (teal/cyan)

### **Screen Architecture**
- **Tab Screens:** Main navigation screens
- **Stack Screens:** One level deeper with back button
- **Modal Screens:** Overlays for details and quick actions
- **Sub-tabs:** Using FacebookTopNavTabs with transparent background, centered layout

## 🛠 Technical Stack

- **Framework:** React Native with Expo
- **Navigation:** React Navigation with bottom tabs + stack navigators
- **UI Library:** React Native Paper + custom components
- **Styling:** Theme-based design system
- **Backend:** Supabase (database + auth)
- **TypeScript:** Strict typing throughout

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── features/     # Feature-specific components
├── screens/
│   ├── auth/         # Authentication flow
│   ├── home/         # Home tab screens (events, courses, etc.)
│   ├── roles/        # Role management screens
│   └── [main tabs]   # GyldScreen, YouScreen, etc.
├── navigation/       # Navigation configuration
├── styles/           # Theme, colors, typography
├── services/         # API and external services
└── types/           # TypeScript definitions
```

## 🔗 Key Integrations

- **Database:** Supabase for user data, events, enrollments
- **Authentication:** Supabase Auth
- **Email:** Planned integration for notifications
- **Deep Links:** Primary entry point for user journeys

## 🎯 Current Status

- ✅ Basic navigation structure implemented
- ✅ Screen skeleton created for all major flows
- ✅ Design system and UI components established
- 🚧 Ready for individual screen development and database integration


## Information Architecture

Auth
    - Sign up
    - Sign in
    - Onboarding

HomeScreen
   - Home (root)  //lists gatherings and experiences to choose from 
   - EventDetail (modal) //shows details of gathering and RSVP
      -Bio (popup)
      -EventSignup (popup)
   - EventOrg (stack) // allows event organizer to manage event that they've already launched (also accessible from roles tab)
        Sub-Tabs: Plan | Resources | Edit
   - CourseBrowse (stack) // allows members to explore and sign up for a class
      -CourseSignup (popup)
   - CoachingBrowse (stack) // allows members to explore group coaching experiences
      -CoachingSignup (popup)
   - CourseJoined (stack) //course page if you are in a course
   - CoachingJoined (stack) //group coaching page if you're sigend up
   - ProBonoBrowse (stack) //allows members to explore and sign up for a pro bono project
      -ProBonoSignup (popup)
   - ProBonoJoined (stack) //page for pro bono project participants
   - TeamBrowse (stack) //allows members to check out a sports team and sign up
      -TeamSignup (popup)
   - TeamJoined (stack) //page for members already on a sports team
   - PodBrowse (stack) //allows members to explore and join a podcast club
      -PodSignup (popup)
   - PodJoined (stack) //page for people in a podcast club
   - LotteryBrowse (stack) //allows members to sign up for a networking service
      -LotterySignup (popup)
   - LotteryJoined (stack) //page for members in the networking service

RolesScreen
    - Roles(root) //user's current roles and opportunity to sign up for a role
    - RoleOverview (modal) //place to explore and sign up for a role
    - RoleRecruit (stack) //page for members in the recruiter role
    - RoleInduct (stack) //page for members in the inductor role
    - RoleOrgMentoring (stack) //page for members in the salon host role
    - RoleOrgEvent (stack) //page for members in the event host role
    - RoleLeadBono (stack) //page for members in the pro bono project leader role
    - RoleLeadTeam (stack) //page for members in the team leader role
    - RoleLeadPod (stack) //page for members in the podcast club leader role
    - RoleInterview (stack) //page for members in the interviewer role
    - RoleScribe (stack) //page for members in the salon scribe role

GyldScreen 
   Sub-Tabs: Members | Mentors | Knowledge
   -Members (root) //lists all members of the Gyld community
   -Mentors (root) //lists all mentors of the Gyld community
   -Knowledge (root) //lists all knowledge resources of the Gyld community

YouScreen 
   Sub-Tabs: Profile | Progress | Settings
   -Profile (root) //allows members to update their preferences
   -Progress (root) //allows members to track their academic progress
   -Settings (root) //allows members to update their settings

---

*This app serves early-career tech professionals by creating structured opportunities for learning, networking, and skill development within city-specific guild communities.* 