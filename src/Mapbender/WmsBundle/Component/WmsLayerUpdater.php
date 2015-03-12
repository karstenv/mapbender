<?php
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Mapbender\WmsBundle\Component;

use Doctrine\Common\Collections\ArrayCollection;
use Mapbender\WmsBundle\Entity\WmsLayerSource;

/**
 * Description of WmsLayerUpdater
 *
 * @author Paul Schmidt
 */
class WmsLayerUpdater extends WmsUpdater
{

    public function findLayer($layer, $layerList)
    {
        $founded = array();
        foreach ($layerList as $layerTmp) {
            if ($layer->getName() === $layerTmp->getName()) {
                $founded[] = $layerTmp;
            }
        }
        return $founded;
    }

    public function cloneLayer(WmsSource $wms, WmsLayerSource $toClone, WmsLayerSource $clonedParent = NULL,
                               $entityManager)
    {
        $cloned = clone $toclone;
        $entityManager->detach($cloned);
        $cloned->setId(null);
        $cloned->setParent($clonedParent);
        $cloned->setPriority($parentForCloned !== null ? $parentForCloned->getPriority : null);
        $cloned->setSource($wms);
        if ($cloned->getSublayer()->count() > 0) {
            $children = new ArrayCollection();
            foreach ($cloned->getSublayer() as $subToClone) {
                $children->add($this->cloneLayer($wms, $subToClone, $cloned, $entityManager));
            }
            $cloned->setSublayer($sublayer);
        }
        return $cloned;
    }
}