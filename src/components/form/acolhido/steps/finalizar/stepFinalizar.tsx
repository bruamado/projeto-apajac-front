import { useRouter } from "next/navigation";

import SubTitle from "../../subTitle";
import styles from "./stepFinalizar.module.css";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { useContext, useState } from "react";
import { flushSync } from "react-dom";

import * as yup from "yup";
import { MultistepFormContext } from "@/hooks/useMultistepForm";
import { restoreInputValue } from "@/functions/restoreInputs";

import { Finalizar } from "@/types/formAcolhido.type";
import { createAcolhido, updateAcolhido } from "@/api/endpoints";

const StepFinalizar = () => {
  const router = useRouter();
  const multistepController = useContext(MultistepFormContext);
  const [disableButtons, setDisableButtons] = useState<boolean>(false);

  //Yup validation schema
  const finalizeSchema: yup.ObjectSchema<Finalizar> = yup.object({
    comments: yup
      .string()
      .max(1000, "Quantidade máxima permitida de carácteres: 1000")
      .transform((_, val) => (val === "" ? null : val))
      .nullable()
      .typeError("Verifique se inseriu corretamente as informações"),
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      comments: restoreInputValue("comments", multistepController || null),
    },
    mode: "onBlur",
    resolver: yupResolver(finalizeSchema),
  });

  function registerAcolhido(data: any) {
    flushSync(() => {
      multistepController?.setCurrentStepData(data);
    });

    setDisableButtons(true);
    if (multistepController?.getId()) {
      updateAcolhido(multistepController?.getResultObject())
        .then(() => {
          window.onbeforeunload = () => null; // Removes the exit confirmation
          router.push("/menu");
        })
        .finally(() => {
          setDisableButtons(false);
        });
    } else {
      createAcolhido(multistepController?.getResultObject())
        .then(() => {
          window.onbeforeunload = () => null; // Removes the exit confirmation
          router.push("/menu");
        })
        .finally(() => {
          setDisableButtons(false);
        });
    }
  }

  function back(data: any) {
    if (
      multistepController?.getCurrentStepData != null &&
      !(
        JSON.stringify(multistepController?.getCurrentStepData) ==
        JSON.stringify(data)
      )
    ) {
      handleSubmit((data) => {
        multistepController?.setCurrentStepData(data);
        multistepController?.back();
      })();
      return;
    }
    multistepController?.setCurrentStepCache(data);
    multistepController?.back();
  }
  return (
    <div className={styles.container}>
      <SubTitle text="Observações adicionais" />
      <SubTitle text="(Opcional)" />
      <form
        onSubmit={handleSubmit((data) => registerAcolhido(data))}
        autoComplete="off"
      >
        <div className={`${styles.formRow} ${styles.formCommentsRow}`}>
          <textarea
            className={`${
              !multistepController?.getActiveStatus() && "disable_input"
            }`}
            tabIndex={!multistepController?.getActiveStatus() ? -1 : undefined}
            {...register("comments")}
            cols={60}
            rows={10}
          />
        </div>
        {errors.comments && (
          <p className={styles.error_message}>
            {String(errors.comments.message)}
          </p>
        )}

        <div className={styles.buttons}>
          <button
            className={`submitBtn ${
              (disableButtons || !multistepController?.getActiveStatus()) &&
              styles.buttons_disabled
            }`}
            disabled={disableButtons}
            onClick={handleSubmit((data) => registerAcolhido(data))}
          >
            {multistepController?.getId
              ? "Finalizar alterações"
              : "Finalizar Cadastro"}
          </button>
          <button
            className={`submitBtn ${disableButtons && styles.buttons_disabled}`}
            type="button"
            disabled={disableButtons}
            onClick={() => back(getValues())}
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
};
export default StepFinalizar;