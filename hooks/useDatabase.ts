import { useEffect } from "react"
import { initDatabase } from "../service/database";

export const useDatabase = () => {
  useEffect(() => {
    initDatabase();
  }, []);
};