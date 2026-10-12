import { useMemo } from 'react'
import {
  INTRO_ELIGIBILITY_STATUS,
  IntroEligibility,
  PACKAGE_TYPE,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases'

const PACKAGE_SORT_ORDER: Partial<Record<PACKAGE_TYPE, number>> = {
  [PACKAGE_TYPE.LIFETIME]: 0,
  [PACKAGE_TYPE.ANNUAL]: 1,
  [PACKAGE_TYPE.MONTHLY]: 2,
}

export function sortPaywallPackages(packages: PurchasesPackage[]): PurchasesPackage[] {
  return [...packages].sort((left, right) => {
    const leftOrder = PACKAGE_SORT_ORDER[left.packageType] ?? 99
    const rightOrder = PACKAGE_SORT_ORDER[right.packageType] ?? 99
    return leftOrder - rightOrder
  })
}

export function formatPackageButtonTitle(
  pkg: PurchasesPackage,
  introEligibility?: IntroEligibility,
): string {
  const { product } = pkg
  const standardLabel = `${product.title} · ${product.priceString}`
  const introPrice = product.introPrice
  const showIntro = introEligibility?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
    && introPrice

  if (!showIntro) {
    return standardLabel
  }

  if (introPrice.price === 0) {
    const unitCount = introPrice.periodNumberOfUnits
    const unit = introPrice.periodUnit.toLowerCase()
    const trialPhrase = unitCount === 1
      ? `1-${unit} free trial`
      : `${unitCount}-${unit} free trial`
    return `${product.title} · ${trialPhrase}, then ${product.priceString}`
  }

  return `${product.title} · ${introPrice.priceString} intro, then ${product.priceString}`
}

export type PaywallPackageRow = {
  pkg: PurchasesPackage
  buttonTitle: string
}

export function usePaywallPackages(
  offerings: PurchasesOfferings | null,
  introEligibilityByProductId: Record<string, IntroEligibility>,
): PaywallPackageRow[] {
  return useMemo(() => {
    const packages = offerings?.current?.availablePackages ?? []
    return sortPaywallPackages(packages).map((pkg) => ({
      pkg,
      buttonTitle: formatPackageButtonTitle(
        pkg,
        introEligibilityByProductId[pkg.product.identifier],
      ),
    }))
  }, [offerings, introEligibilityByProductId])
}
