import React from 'react'
import AppList from '@/app/components/explore/app-list'
import NormalUserGuard from '@/components/route-guard/normal-user-guard'

const Apps = () => {
  return (
    <NormalUserGuard>
      <AppList />
    </NormalUserGuard>
  )
}

export default React.memo(Apps)
