<div align="center">
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 20V12" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M15 20V4" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M3 20V16" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M21 20V8" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
  <h1>OpenKanban</h1>
  <p>
    <strong>A modern, open-source Kanban board to streamline your workflow.</strong>
  </p>
  <p>
    Built with Next.js, Firebase, and Tailwind CSS for a seamless project management experience.
  </p>
  <br />
    <img src="https://img.shields.io/badge/Next.js-15.x-black?logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/Firebase-v11-FFCA28?logo=firebase" alt="Firebase">
    <img src="https://img.shields.io/badge/Tailwind_CSS-v3-38B2AC?logo=tailwind-css" alt="Tailwind CSS">
    <img src="https://img.shields.io/github/license/listerineh/open-kanban-board?color=blue" alt="License">
</div>

---

## ✨ Key Features

OpenKanban is packed with features designed to make project management intuitive and collaborative.

| Feature                 | Description                                                                                                  | Status |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | :----: |
| **Project Dashboard**   | Visualize project progress with insightful charts for task status, priority, and member workload. (Optional) |   ✅   |
| **Project Management**  | Create, edit, and delete projects with ease.                                                                 |   ✅   |
| **Task Organization**   | Add, update, and delete tasks within columns.                                                                |   ✅   |
| **Drag & Drop**         | Intuitively move tasks between columns and reorder columns on your board.                                    |   ✅   |
| **Sub-tasks**           | Break down complex tasks into smaller, manageable sub-tasks. (Optional)                                      |   ✅   |
| **Task Deadlines**      | Set deadlines for tasks to keep your projects on track. (Optional)                                           |   ✅   |
| **Task Priorities**     | Assign priorities (Urgent, High, Medium, Low) to focus on what matters most.                                 |   ✅   |
| **Task Labels**         | Assign color-coded labels to tasks for better categorization. (Optional)                                     |   ✅   |
| **Task Search**         | Quickly find tasks within a project using the board-level search bar.                                        |   ✅   |
| **Advanced Task Filtering** | Filter tasks on the board by assignee, priority, and labels to focus on specific work.                   |   ✅   |
| **Activity Log**        | Track the history of changes for each task.                                                                  |   ✅   |
| **User Collaboration**  | Invite members to your projects via email for seamless teamwork.                                             |   ✅   |
| **Task Assignment**     | Assign tasks to specific project members.                                                                    |   ✅   |
| **User Authentication** | Secure Google Authentication to protect your projects.                                                       |   ✅   |
| **Notifications**       | Receive alerts for important events like task assignments and project invitations.                           |   ✅   |
| **Responsive Design**   | A fully responsive UI that works beautifully on desktop and mobile devices.                                  |   ✅   |
| **Toast Notifications** | Get instant feedback for your actions with clean, modern toast alerts.                                       |   ✅   |
| **Dark Mode**           | A beautiful dark mode for comfortable viewing in low-light conditions.                                       |   ✅   |
| **Customizable Themes** | Personalize your board with multiple color themes.                                                           |   ✅   |
| **State Persistence**   | Your session is cached, so refreshing the page won't log you out or lose your place.                         |   ✅   |

---

## 🛠 Tech Stack

### Core Technologies

- **[Next.js](https://nextjs.org/)**: The React framework for building fast, server-rendered applications.
- **[React](https://react.dev/)**: A JavaScript library for building user interfaces.
- **[Firebase](https://firebase.google.com/)**: Provides backend services, including Authentication and Firestore Database.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[TypeScript](https://www.typescriptlang.org/)**: A statically typed superset of JavaScript that enhances code quality.

### UI & Components

- **[ShadCN/UI](https://ui.shadcn.com/)**: A collection of beautifully designed, reusable components.
- **[Lucide React](https://lucide.dev/)**: A clean and consistent icon toolkit.
- **[Framer Motion](https://www.framer.com/motion/)**: Powers the smooth animations across the app.
- **[Recharts](https://recharts.org/)**: A composable charting library built on React components.

---

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/listerineh/open-kanban-board.git
    cd open-kanban-board
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Set up environment variables**
    - Create a `.env` file in the root of your project.
    - Add your Firebase project configuration to this file. You can get these from the Firebase console.

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
