import ActivateAccountForm from "./ActivateAccountForm";

export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <ActivateAccountForm token={token} />;
}
