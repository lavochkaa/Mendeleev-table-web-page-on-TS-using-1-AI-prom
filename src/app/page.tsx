import ClientApp from '@/components/ClientApp'

// Server component — just delegates to the client shell
export default function Home() {
  return <ClientApp />
}
