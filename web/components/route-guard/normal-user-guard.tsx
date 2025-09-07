'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/app-context'

type NormalUserGuardProps = {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * 路由守卫组件：阻止普通用户访问管理页面
 */
const NormalUserGuard: React.FC<NormalUserGuardProps> = ({
  children,
  redirectTo = '/datasets',
}) => {
  const router = useRouter()
  const { currentWorkspace } = useAppContext()
  const isNormalUser = currentWorkspace.role === 'normal'

  useEffect(() => {
    if (isNormalUser) {
      console.log('普通用户尝试访问受限页面，重定向到:', redirectTo)
      router.push(redirectTo)
    }
  }, [isNormalUser, router, redirectTo])

  // 如果是普通用户，不渲染内容（已重定向）
  if (isNormalUser)
    return null

  return <>{children}</>
}

export default NormalUserGuard
