'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import ExploreContext from '@/context/explore-context'
import Sidebar from '@/app/components/explore/sidebar'
import { useAppContext } from '@/context/app-context'
import { fetchMembers } from '@/service/common'
import type { InstalledApp } from '@/models/explore'

export type IExploreProps = {
  children: React.ReactNode
}

const Explore: FC<IExploreProps> = ({
  children,
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [controlUpdateInstalledApps, setControlUpdateInstalledApps] = useState(0)
  const { userProfile, isCurrentWorkspaceDatasetOperator } = useAppContext()
  const [hasEditPermission, setHasEditPermission] = useState(false)
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([])
  const [workspaceCollapseState, setWorkspaceCollapseState] = useState(false)

  useEffect(() => {
    document.title = `${t('explore.title')} - Dify`;
    (async () => {
      const { accounts } = await fetchMembers({ url: '/workspaces/current/members', params: {} })
      if (!accounts)
        return
      const currUser = accounts.find(account => account.id === userProfile.id)
      setHasEditPermission(currUser?.role !== 'normal' && currUser?.role !== 'editor')
    })()
  }, [])

  useEffect(() => {
    if (isCurrentWorkspaceDatasetOperator)
      return router.replace('/datasets')
  }, [isCurrentWorkspaceDatasetOperator])

  return (
    <div className='flex h-full overflow-hidden border-t border-divider-regular bg-background-body'>
      <ExploreContext.Provider
        value={
          {
            controlUpdateInstalledApps,
            setControlUpdateInstalledApps,
            hasEditPermission,
            installedApps,
            setInstalledApps,
            workspaceCollapseState,
            setWorkspaceCollapseState,
          }
        }
      >
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          workspaceCollapseState ? 'w-0' : 'w-auto'
        }`}>
          <Sidebar controlUpdateInstalledApps={controlUpdateInstalledApps} />
        </div>
        <div className='w-0 grow transition-all duration-300 ease-in-out relative'>
          {workspaceCollapseState && (
            <button
              onClick={() => setWorkspaceCollapseState(false)}
              className='absolute top-4 left-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-background-default-hover shadow-md transition-all duration-200 hover:bg-background-default-hover hover:shadow-lg'
              title="显示工作区"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {children}
        </div>
      </ExploreContext.Provider>
    </div>
  )
}
export default React.memo(Explore)
