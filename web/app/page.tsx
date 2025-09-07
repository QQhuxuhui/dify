'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/app-context'
import Loading from '@/app/components/base/loading'

const Home = () => {
  const router = useRouter()
  const { currentWorkspace } = useAppContext()
  const isNormalUser = currentWorkspace.role === 'normal'

  useEffect(() => {
    if (isNormalUser) {
      // 普通用户跳转到数据集页面（知识库功能）
      router.push('/datasets')
    }
    else {
      // 其他用户跳转到应用页面
      router.push('/apps')
    }
  }, [isNormalUser, router])

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Loading type='area' />
        <div className="mt-10 text-center">
          正在加载...
        </div>
      </div>
    </div>
  )
}

export default Home
