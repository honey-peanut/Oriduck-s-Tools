import { useNavigate } from 'react-router-dom'

export function useLoadingNavigate() {
  const navigate = useNavigate()
  return (to) => navigate('/loading', { state: { to } })
}