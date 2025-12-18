'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/app-context'

type NormalUserGuardProps = {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * 路由守卫组件：阻止受限用户(normal和editor角色)访问管理页面
 */
const NormalUserGuard: React.FC<NormalUserGuardProps> = ({
  children,
  redirectTo = '/datasets',
}) => {
  const router = useRouter()
  const { currentWorkspace } = useAppContext()
  const isLimitedUser = currentWorkspace.role === 'normal' || currentWorkspace.role === 'editor'

  useEffect(() => {
    if (isLimitedUser) {
      console.log('受限用户尝试访问受限页面，重定向到:', redirectTo)
      router.push(redirectTo)
    }
  }, [isLimitedUser, router, redirectTo])

  // 如果是受限用户，不渲染内容（已重定向）
  if (isLimitedUser)
    return null

  return <>{children}</>
}

export default NormalUserGuard
