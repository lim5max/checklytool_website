import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Создание проверочной работы | Checkly",
  description: "Создайте новую проверочную работу с настраиваемыми критериями оценки"
}

export default function CheckCreationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}