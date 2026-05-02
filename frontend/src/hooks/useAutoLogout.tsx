import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function useAutoLogout(timeout = 10 * 60 * 1000) { // 10 minutes
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof window.setTimeout>;

    const logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      navigate("/");
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, timeout);
    };

    // events to detect activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer(); // start timer

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [navigate, timeout]);
}

export default useAutoLogout;
