"use client";

import Image from "next/image";
import styles from "./header.module.css";
import { useRouter } from "next/navigation";
import * as icon from "react-flaticons";
import { useContext } from "react";
import { SessionContext } from "@/app/(auth)/layout";

const HOME_PATH = "/menu";

const Header = () => {
  const router = useRouter();
  const session = useContext(SessionContext);

  function goToHome() {
    router.push(HOME_PATH);
  }

  function handleLogout() {
    localStorage.removeItem("session");
    router.push("/login");
  }
  return (
    <header className={styles.container}>
      <Image
        onClick={() => goToHome()}
        src={"/icons/apajac.jpg"}
        alt="Logotipo da APAJAC"
        width={48}
        height={48}
      />
      <p onClick={() => goToHome()} className={styles.title}>
        SISTEMA DE GERENCIAMENTO APAJAC
      </p>

      <div className={styles.logoutContainer}>
        <p>Olá, {session?.sessionInfo.name?.split(" ")[0]}</p>
        <p onClick={() => handleLogout()} className={styles.logout}>
          Logout <icon.Exit />
        </p>
      </div>
    </header>
  );
};
export default Header;
