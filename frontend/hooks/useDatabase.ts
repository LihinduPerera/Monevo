import { useEffect } from "react";
import { initDatabase } from "../services/database";

export const useDatabase = () => {
  useEffect(() => {
    initDatabase();
  }, []);
};