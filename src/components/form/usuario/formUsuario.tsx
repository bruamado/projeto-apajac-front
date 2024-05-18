"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import styles from "./formUsuario.module.css";

import FormTitle from "@/components/titles/form/form";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import {
  createUsuario,
  updateUsuario,
  updateUsuarioStatus,
} from "@/api/endpoints";
import { Usuario } from "@/types/formUsuario.type";
import containsUppercase from "@/functions/containsUppercase";
import { ROLES } from "@/constants/roles";

type Props = {
  usuario?: Usuario;
};

function FormUsuario({ usuario }: Props) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState(false);

  const [isActive, setIsActive] = useState(usuario ? usuario.status : true);

  const adminRef = useRef<HTMLInputElement | null>(null);
  const alterarAcolhidoRef = useRef<HTMLInputElement | null>(null);
  const cadastrarAcolhidoRef = useRef<HTMLInputElement | null>(null);
  const consultarAcolhidoRef = useRef<HTMLInputElement | null>(null);

  //Yup validation schema
  const usuarioSchema: yup.ObjectSchema<
    Omit<Usuario, "roles" | "id" | "status">
  > = yup.object({
    name: yup
      .string()
      .required("Obrigatório inserir o nome do acolhido")
      .transform((_, val: string) => val.toUpperCase())
      .trim()
      .min(3, "Nome precisa ter no mínimo 3 caracteres")
      .max(255, "Quantidade máxima permitida de carácteres: 255")
      .typeError("Insira o nome do acolhido"),

    login: yup
      .string()
      .trim()
      .required("Obrigatório inserir um login")
      .test("login_check", function (value) {
        if (value.split("").includes(" "))
          return this.createError({
            message: "O login não pode conter espaços",
            path: "login",
          });

        if (containsUppercase(value))
          return this.createError({
            message: "O login não pode conter letras maiúsculas",
            path: "login",
          });

        return true;
      })
      .min(3, "Inserir um login com pelo menos 3 caracteres")
      .max(15, "Login deve ter no máximo 15 caracteres")
      .typeError("Insira um login"),

    password: yup
      .string()
      .test("password_check", function (value) {
        const min = 6;
        const max = 20;

        if (!value || value == "") return true;

        if (value.length < min)
          return this.createError({
            message: `A senha precisa ter no mínimo ${min} caracteres.`,
            path: "password",
          });

        if (value.length > max)
          return this.createError({
            message: `A senha precisa ter no máximo ${max} caracteres.`,
            path: "password",
          });

        if (value.split("").includes(" "))
          return this.createError({
            message: "A senha não pode conter espaços",
            path: "password",
          });

        return true;
      })
      .transform((_, val) => (val === "" ? null : val))
      .nullable()
      .typeError("Insira um password"),

    repeatPassword: yup
      .string()
      .transform((_, val) => (val === "" ? null : val))
      .nullable()
      .oneOf([yup.ref("password")], "As senhas inseridas não são iguais.")
      .typeError("Repita a senha"),
  });

  // Setting the form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: usuario ? usuario.name : "",
      login: usuario ? usuario.login : "",
      password: "",
      repeatPassword: "",
    },
    mode: "onBlur",
    resolver: yupResolver(usuarioSchema),
  });

  useEffect(() => {
    window.onbeforeunload = () => true;
  }, []);

  function registerUsuario(data: any) {
    const dataWithRoles = { ...data, roles: getRoles() };
    console.log("dataWithRoles", dataWithRoles);
    setIsLoading(true);
    if (usuario) {
      const dataWithId = { id: usuario.id, ...dataWithRoles };
      updateUsuario(dataWithId)
        .then(() => {
          window.onbeforeunload = () => null;
          router.push("/menu");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      createUsuario(dataWithRoles)
        .then(() => {
          window.onbeforeunload = () => null;
          router.push("/menu");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }

  function handlePermissionCheck({ target }: any) {
    const permissionClicked = target && target.name;
    const checked = target && target.checked;

    if (!checked) {
      if (
        permissionClicked != ROLES.ADMINISTRADOR &&
        adminRef!.current!.checked
      )
        adminRef!.current!.checked = false;

      if (
        permissionClicked == ROLES.CONSULTAR_ACOLHIDO &&
        alterarAcolhidoRef!.current!.checked
      )
        alterarAcolhidoRef!.current!.checked = false;

      return;
    }

    if (permissionClicked === ROLES.ALTERAR_ACOLHIDO) {
      consultarAcolhidoRef!.current!.checked = true;
    }

    if (permissionClicked === ROLES.ADMINISTRADOR && checked) {
      if (
        !confirm(
          "Tem certeza de que este usuário será um Administrador?\nEle poderá alterar a senha de outros usuários e terá acesso completo à todas as funções da aplicação."
        )
      ) {
        target.checked = false;
        return;
      }
      alterarAcolhidoRef!.current!.checked = true;
      cadastrarAcolhidoRef!.current!.checked = true;
      consultarAcolhidoRef!.current!.checked = true;
    }
  }

  function getRoles() {
    let roles = [];
    if (adminRef && adminRef.current && adminRef.current.checked)
      roles.push(ROLES.ADMINISTRADOR);
    if (
      alterarAcolhidoRef &&
      alterarAcolhidoRef.current &&
      alterarAcolhidoRef.current.checked
    )
      roles.push(ROLES.ALTERAR_ACOLHIDO);
    if (
      consultarAcolhidoRef &&
      consultarAcolhidoRef.current &&
      consultarAcolhidoRef.current.checked
    )
      roles.push(ROLES.CONSULTAR_ACOLHIDO);
    if (
      cadastrarAcolhidoRef &&
      cadastrarAcolhidoRef.current &&
      cadastrarAcolhidoRef.current.checked
    )
      roles.push(ROLES.CADASTRAR_ACOLHIDO);

    return roles;
  }

  function toggleUsuarioStatus() {
    const previousStatus = isActive;
    if (
      previousStatus &&
      !confirm(
        "Deseja desativar este usuário?\nQualquer mudança não salva será perdida."
      )
    )
      return;

    setIsLoading(true);
    updateUsuarioStatus(usuario!.id!, !isActive)
      .then(() => {
        setIsActive((oldValue) => !oldValue);
        if (previousStatus) {
          // If it was active, you are deactivating
          window.onbeforeunload = () => null; // Removes the exit confirmation
          /* window.location.reload(); */
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className={styles.container}>
      <div>
        <FormTitle className={styles.title} title="Cadastrar Usuário" />
      </div>

      <div>
        <p className={styles.required_message}>* Campos obrigatórios</p>
      </div>

      <form
        onSubmit={handleSubmit((data) => registerUsuario(data))}
        autoComplete="off"
      >
        <div className={`${styles.formRow} ${styles.input_big}`}>
          <label htmlFor="name" className={styles.required}>
            Nome
          </label>
          <input
            type="text"
            id="name"
            style={{ textTransform: "uppercase" }}
            className={`${!isActive && "disable_input"}`}
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className={styles.error_message}>{String(errors.name.message)} </p>
        )}

        <div className={`${styles.formRow} ${styles.input_small}`}>
          <label htmlFor="login" className={styles.required}>
            Login
          </label>
          <input
            type="text"
            id="login"
            className={`${!isActive && "disable_input"}`}
            {...register("login")}
          />
        </div>
        {errors.login && (
          <p className={styles.error_message}>{String(errors.login.message)}</p>
        )}

        <div className={styles.formRow}>
          <label htmlFor="password" className={styles.required}>
            Senha
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder={usuario ? "Digite para trocar a senha" : undefined}
            className={`${!isActive && "disable_input"}`}
            {...register("password")}
          />
          <Image
            className={styles.show_password_icon}
            src={
              showPassword
                ? "/icons/invisible_30x30.png"
                : "/icons/visible_30x30.png"
            }
            alt="Exibir a senha"
            width={18}
            height={18}
            onClick={() => setShowPassword((currentValue) => !currentValue)}
          />
        </div>
        {errors.password && (
          <p className={styles.error_message}>
            {String(errors.password.message)}
          </p>
        )}

        <div className={styles.formRow}>
          <label htmlFor="repeatPassword" className={styles.required}>
            Repita a senha
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="repeatPassword"
            placeholder={usuario ? "Digite para trocar a senha" : undefined}
            className={`${!isActive && "disable_input"}`}
            {...register("repeatPassword")}
          />
        </div>
        {errors.repeatPassword && (
          <p className={styles.error_message}>
            {String(errors.repeatPassword.message)}
          </p>
        )}

        <div className={styles.formRow}>
          <label className={styles.required}>Permissões</label>

          <div className={styles.permissions}>
            <div className={`${styles.permission_admin} ${styles.permission}`}>
              <label htmlFor={ROLES.ADMINISTRADOR}>Administrador</label>
              <input
                className={`${!isActive && "disable_input"}`}
                disabled={!isActive}
                type="checkbox"
                name={ROLES.ADMINISTRADOR}
                value={ROLES.ADMINISTRADOR}
                onClick={(e) => handlePermissionCheck(e)}
                ref={adminRef}
                defaultChecked={
                  usuario &&
                  usuario.roles &&
                  usuario.roles.includes(ROLES.ADMINISTRADOR)
                    ? true
                    : undefined
                }
              />
            </div>

            <div className={styles.permission}>
              <label htmlFor={ROLES.ALTERAR_ACOLHIDO}>Alterar acolhido</label>
              <input
                className={`${!isActive && "disable_input"}`}
                disabled={!isActive}
                type="checkbox"
                name={ROLES.ALTERAR_ACOLHIDO}
                value={ROLES.ALTERAR_ACOLHIDO}
                onClick={(e) => handlePermissionCheck(e)}
                ref={alterarAcolhidoRef}
                defaultChecked={
                  usuario &&
                  usuario.roles &&
                  usuario.roles.includes(ROLES.ALTERAR_ACOLHIDO)
                    ? true
                    : undefined
                }
              />
            </div>

            <div className={styles.permission}>
              <label htmlFor={ROLES.CONSULTAR_ACOLHIDO}>
                Consultar acolhido
              </label>
              <input
                className={`${!isActive && "disable_input"}`}
                disabled={!isActive}
                type="checkbox"
                name={ROLES.CONSULTAR_ACOLHIDO}
                value={ROLES.CONSULTAR_ACOLHIDO}
                onClick={(e) => handlePermissionCheck(e)}
                ref={consultarAcolhidoRef}
                defaultChecked={
                  usuario &&
                  usuario.roles &&
                  usuario.roles.includes(ROLES.CONSULTAR_ACOLHIDO)
                    ? true
                    : undefined
                }
              />
            </div>

            <div className={styles.permission}>
              <label htmlFor={ROLES.CADASTRAR_ACOLHIDO}>
                Cadastrar acolhido
              </label>
              <input
                className={`${!isActive && "disable_input"}`}
                disabled={!isActive}
                type="checkbox"
                name={ROLES.CADASTRAR_ACOLHIDO}
                value={ROLES.CADASTRAR_ACOLHIDO}
                onClick={(e) => handlePermissionCheck(e)}
                ref={cadastrarAcolhidoRef}
                defaultChecked={
                  usuario &&
                  usuario.roles &&
                  usuario.roles.includes(ROLES.CADASTRAR_ACOLHIDO)
                    ? true
                    : undefined
                }
              />
            </div>
          </div>
        </div>
        {/* {errors.roles && (
          <p className={styles.error_message}>{String(errors.roles.message)}</p>
        )} */}

        <div className={styles.buttons}>
          <button
            type="submit"
            className={`button_submit ${isLoading && "disable_button"}`}
            disabled={isLoading}
            onClick={handleSubmit((data) => registerUsuario(data))}
          >
            {usuario ? "Alterar cadastro" : "Cadastrar usuário"}
          </button>

          {usuario && (
            <button
              type="button"
              className={`${
                isActive ? "button_deactivate" : "button_activate"
              } ${isLoading && "disable_button"}`}
              disabled={isLoading}
              onClick={() => toggleUsuarioStatus()}
            >
              {isActive ? "Desativar usuário" : "Ativar usuário"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default FormUsuario;
