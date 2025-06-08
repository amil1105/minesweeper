# 💣 Minesweeper

This project is a Minesweeper game developed for the Game Center platform. It can work both as a standalone application and be loaded as an iframe within the main Game Center application.

## 🚀 Features

- Modern, responsive interface design
- Single player and multiplayer modes
- Automatic demo mode when backend is unavailable
- Customizable game field size and mine count
- Flag marking and counter
- Timer functionality

## 🛠️ Technologies

- React 18
- Vite
- Material UI
- Socket.IO (for multiplayer mode)

## 💻 Installation

To run the project in your local environment:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔌 Demo Mode

The application automatically switches to demo mode when unable to connect to the backend API. This mode provides:

- Simulated Socket.IO connection
- Local game state management
- Single player experience

To manually enable demo mode:
```javascript
localStorage.setItem('game-center-demo-mode', 'true');
```

## 🔄 Main Application Integration

The game can be loaded as an iframe within the main Game Center application:

```jsx
<iframe 
  src="http://localhost:3001?lobbyId={lobbyId}" 
  title="Minesweeper" 
  width="100%" 
  height="600px" 
  style={{ border: 'none' }}
/>
```

## 📁 Project Structure

```
/src
  /components       # UI components
  /hooks            # Custom React hooks
  /pages            # Page components
  /utils            # Helper functions and API
  App.jsx           # Main application component
  main.jsx          # Entry point
```

## 🧩 Development

When adding new features or fixing bugs, please adhere to the existing code style:
- Use functional components and hooks
- Prefer Material UI components
- Use prop-types for type safety
- Write clean and commented code

## 📝 License

This project is licensed under the [MIT License](LICENSE). 