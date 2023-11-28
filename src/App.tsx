import { BrowserRouter, Routes, Route,Navigate} from "react-router-dom";
import NewUserPage from "./routes/NewUserPage/NewUserPage";
import userAccount from "./utils/userAccount";
import { useEffect, useState } from "react";
import Settings from "./routes/Settings/Settings";
import GammaNavbar from "./components/core/GammaNavbar";
import BuyToken from "./routes/BuyToken/BuyToken";
import SellToken from "./routes/SellToken/SellToken";

function App() {

  const [hasAccount, setHasAccount] = useState(false);
  useEffect(() => {
    const fetchAccountStatus = async () => {
      const resp = await userAccount.getGammaData()
      if(resp) {
        setHasAccount(true)
      }
    }
    fetchAccountStatus();
   

  },[])


  return (<>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<GammaNavbar></GammaNavbar>}>
        
        <Route path="buy_token" element={<BuyToken></BuyToken>} />
        
        <Route path="sell_token" element={<SellToken></SellToken>} />
        
        <Route path="settings" element={<Settings></Settings>} />
        
        <Route path="*" element={<Navigate to="/buy_token" />} />
      </Route>
      
      <Route path="new_user_page" element={<NewUserPage></NewUserPage>} />
    
    </Routes>
  </BrowserRouter>
  </>

  );
}

export default App;
