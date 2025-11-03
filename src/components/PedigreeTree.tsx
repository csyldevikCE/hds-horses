import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PedigreeNode {
  sire: string
  dam: string
  sireSire?: string
  sireDam?: string
  damSire?: string
  damDam?: string
  sireSireSire?: string
  sireSireDam?: string
  sireDamSire?: string
  sireDamDam?: string
  damSireSire?: string
  damSireDam?: string
  damDamSire?: string
  damDamDam?: string
}

interface PedigreeTreeProps {
  horseName: string
  pedigree: PedigreeNode
  compact?: boolean
}

export const PedigreeTree = ({ horseName, pedigree }: PedigreeTreeProps) => {
  return (
    <div className="w-full space-y-6">
      {/* Subject Horse */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3 text-sm">Subject</Badge>
            <div className="text-2xl md:text-3xl font-bold">{horseName}</div>
          </div>
        </CardContent>
      </Card>

      {/* Parents - Generation 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sire */}
        <Card className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">Sire</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold mb-4">{pedigree.sire}</p>

            {/* Sire's Parents - Generation 3 */}
            {(pedigree.sireSire || pedigree.sireDam) && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                {pedigree.sireSire && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Sire's Sire</p>
                    <p className="font-medium text-base">{pedigree.sireSire}</p>

                    {/* Great-grandparents */}
                    {(pedigree.sireSireSire || pedigree.sireSireDam) && (
                      <div className="mt-2 pl-3 border-l-2 border-muted space-y-1">
                        {pedigree.sireSireSire && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">SSS:</span> {pedigree.sireSireSire}
                          </p>
                        )}
                        {pedigree.sireSireDam && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">SSD:</span> {pedigree.sireSireDam}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {pedigree.sireDam && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Sire's Dam</p>
                    <p className="font-medium text-base">{pedigree.sireDam}</p>

                    {/* Great-grandparents */}
                    {(pedigree.sireDamSire || pedigree.sireDamDam) && (
                      <div className="mt-2 pl-3 border-l-2 border-muted space-y-1">
                        {pedigree.sireDamSire && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">SDS:</span> {pedigree.sireDamSire}
                          </p>
                        )}
                        {pedigree.sireDamDam && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">SDD:</span> {pedigree.sireDamDam}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dam */}
        <Card className="bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900">Dam</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold mb-4">{pedigree.dam}</p>

            {/* Dam's Parents - Generation 3 */}
            {(pedigree.damSire || pedigree.damDam) && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                {pedigree.damSire && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Dam's Sire</p>
                    <p className="font-medium text-base">{pedigree.damSire}</p>

                    {/* Great-grandparents */}
                    {(pedigree.damSireSire || pedigree.damSireDam) && (
                      <div className="mt-2 pl-3 border-l-2 border-muted space-y-1">
                        {pedigree.damSireSire && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">DSS:</span> {pedigree.damSireSire}
                          </p>
                        )}
                        {pedigree.damSireDam && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">DSD:</span> {pedigree.damSireDam}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {pedigree.damDam && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Dam's Dam</p>
                    <p className="font-medium text-base">{pedigree.damDam}</p>

                    {/* Great-grandparents */}
                    {(pedigree.damDamSire || pedigree.damDamDam) && (
                      <div className="mt-2 pl-3 border-l-2 border-muted space-y-1">
                        {pedigree.damDamSire && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">DDS:</span> {pedigree.damDamSire}
                          </p>
                        )}
                        {pedigree.damDamDam && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">DDD:</span> {pedigree.damDamDam}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300" />
          <span>Sire Line (Male)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white dark:bg-gray-950 border border-gray-300" />
          <span>Dam Line (Female)</span>
        </div>
      </div>
    </div>
  )
}
