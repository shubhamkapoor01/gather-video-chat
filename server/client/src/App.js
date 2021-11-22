import './App.css';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import JoinRoom from "./JoinRoom";
import Room from './Room';

// TODO add mongodb login authentication

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={ JoinRoom } />
        <Route path="/room/:roomID" component={ Room } /> 
      </Switch>
    </BrowserRouter>
  );
}

export default App;