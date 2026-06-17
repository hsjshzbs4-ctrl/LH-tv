# PB7 Final Architecture
```
Marketplace → Community → Enterprise → Runtime
                    ↓
            GovernanceFacade
                    ↓
            GovernancePipeline (validate→authorize→certify→audit→metrics→report)
                    ↓
            GovernanceRegistry (Policy+Certification+Event+Metrics+Adapter)
                    ↓
            GovernanceEventBus (CRITICAL>HIGH>NORMAL>LOW, FIFO, sync/async/flush)
                    ↓
            Audit → Metrics → Certification
                    ↓
            TrustChain (Publisher→Signature→ManifestHash→Certification→RuntimeVersion→HostAPI)
                    ↓
            Runtime → HostAPI
```
