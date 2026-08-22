"use client";

import { useState, type FormEvent } from "react";
import { ChevronRight, Gamepad2, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const fieldClassName =
  "h-12 rounded-sm border-border bg-background px-4 shadow-none focus-visible:border-primary focus-visible:ring-primary/20";

export function ClanJoinModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/clan-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: formData.get("nickname"),
          displayName: formData.get("displayName"),
          age: Number(formData.get("age")),
          // BOBO는 Kakao 서버 클랜이므로 현재 가입 폼에서는 플랫폼을 고정한다.
          platform: "kakao",
        }),
      });
      const result = (await response.json()) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(result.error?.message ?? "클랜 가입에 실패했어.");
      }

      setOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "클랜 가입에 실패했어.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <button onClick={() => setOpen(true)} className="inline-flex h-12 items-center gap-3 rounded-sm bg-primary px-6 text-sm font-black text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary-hover cursor-pointer">
      아이디 등록 <ChevronRight className="size-4" />
    </button>

    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent
        className="gap-0 overflow-x-hidden overflow-y-auto rounded-sm border-border bg-surface-elevated p-0 shadow-[0_32px_100px_rgba(0,0,0,.65)] ring-0 sm:max-w-xl"
        showCloseButton
      >
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />

        <DialogHeader className="relative gap-0 border-b border-border/60 px-6 py-6 sm:px-8">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] text-primary">
            <ShieldCheck className="size-3.5" /> BOBO CLAN REGISTRATION
          </p>
          <DialogTitle className="text-3xl font-black tracking-[-0.045em]">
            아이디 등록
          </DialogTitle>
          <DialogDescription className="mt-3 leading-6">
            Battle Ground 계정 확인을 위해 아래 정보를 입력해 주세요.
          </DialogDescription>
        </DialogHeader>

        <form
          autoComplete="off"
          className="relative px-6 py-7 sm:px-8"
          onSubmit={handleSubmit}
        >
          <FieldGroup>
            <Field>
              <FieldLabel
                className="text-[11px] font-black tracking-[0.12em]"
                htmlFor="nickname"
              >
                Battle Ground 닉네임 <b className="text-primary">*</b>
              </FieldLabel>
              <div className="relative">
                <Gamepad2 className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoComplete="off"
                  className={`${fieldClassName} pl-11`}
                  disabled={isSubmitting}
                  id="nickname"
                  name="nickname"
                  placeholder="게임에서 사용하는 닉네임"
                  required
                />
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
              <Field>
                <FieldLabel
                  className="text-[11px] font-black tracking-[0.12em]"
                  htmlFor="displayName"
                >
                  이름 <b className="text-primary">*</b>
                </FieldLabel>
                <Input
                  autoComplete="off"
                  className={fieldClassName}
                  disabled={isSubmitting}
                  id="displayName"
                  name="displayName"
                  placeholder="클랜에서 부를 이름"
                  required
                />
              </Field>

              <Field>
                <FieldLabel
                  className="text-[11px] font-black tracking-[0.12em]"
                  htmlFor="age"
                >
                  나이 <b className="text-primary">*</b>
                </FieldLabel>
                <Input
                  autoComplete="off"
                  className={fieldClassName}
                  disabled={isSubmitting}
                  id="age"
                  max={120}
                  min={1}
                  name="age"
                  placeholder="예: 25"
                  required
                  type="number"
                />
              </Field>
            </div>

            <DialogFooter className="mx-0 mb-0 grid grid-cols-[1fr_1.65fr] gap-3 rounded-none border-border/60 bg-transparent p-0 pt-6">
              <DialogClose
                render={
                  <Button
                    className="h-12 rounded-sm text-xs font-black tracking-[0.08em]"
                    disabled={isSubmitting}
                    variant="outline"
                  />
                }
              >
                취소
              </DialogClose>
              <Button
                className="h-12 rounded-sm text-xs font-black tracking-[0.08em] hover:bg-primary-hover"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {isSubmitting ? "확인 중" : "가입 신청"}
              </Button>
            </DialogFooter>

            {submitError && <FieldError>{submitError}</FieldError>}

            <p className="text-center text-[10px] leading-5 text-muted-foreground/70">
              등록 시 Battle Ground 닉네임과 클랜 소속 여부를 확인합니다.
            </p>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>

    </>
      );
}
