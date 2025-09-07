'use client'
import PluginPage from '@/app/components/plugins/plugin-page'
import PluginsPanel from '@/app/components/plugins/plugin-page/plugins-panel'
import Marketplace from '@/app/components/plugins/marketplace'
import NormalUserGuard from '@/components/route-guard/normal-user-guard'

const PluginList = () => {
  return (
    <NormalUserGuard>
      <PluginPage
        plugins={<PluginsPanel />}
        marketplace={<Marketplace locale="en" pluginTypeSwitchClassName='top-[60px]' searchBoxAutoAnimate={false} />}
      />
    </NormalUserGuard>
  )
}

export const metadata = {
  title: 'Plugins - Dify',
}

export default PluginList
