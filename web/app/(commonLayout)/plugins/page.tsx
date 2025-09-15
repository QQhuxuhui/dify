import PluginPage from '@/app/components/plugins/plugin-page'
import PluginsPanel from '@/app/components/plugins/plugin-page/plugins-panel'
import Marketplace from '@/app/components/plugins/marketplace'
import NormalUserGuard from '@/components/route-guard/normal-user-guard'

export const metadata = {
  title: 'Plugins - Dify',
}

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

export default PluginList
