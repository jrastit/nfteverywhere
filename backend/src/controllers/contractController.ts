import db from '../models'
const Contract = db.contract
import { RequestHandler } from 'express'
import { getNetworkFromChainId } from 'ethers-network/network'
import { getWallet } from 'ethers-network/network'
import { createContractNFT, getHashContractNFT, getContractNFT } from 'contract/contract'
import { getPrivateKey } from '../utils/privateKey'

export const deployContract: RequestHandler = async (req, res) => {
  try {
    const chainId = req.body.chainId
    const network = getNetworkFromChainId(chainId)
    if (network) {
      const privateKeys = getPrivateKey(req.body.chainId)
      const wallet = getWallet(network, privateKeys)
      const hash = getHashContractNFT()
      const name = req.body.name
      let contract
      switch (name) {
        case 'NFT':
          contract = await createContractNFT(
            wallet.address,
            hash,
            wallet,
          )
          break
        default:
          return res.status(403).send({ message: "Contract not found" })
      }
      Contract.create({
        chainId,
        hash: hash.toHexString(),
        name: name,
        address: contract.address,
      })
      return res.send({
        address: contract.address,
      })
    }
  }
  catch (err: any) {
    res.status(500).send({ message: err.message })
  }
}

export const getContract: RequestHandler = async (req, res) => {
  try {
    Contract.findOne({
      where: {
        chainId: req.body.chainId,
        hash: req.body.hash,
        name: req.body.name,
      }
    }).then(contract => {
      if (contract) {
        return res.send({
          address: contract.address
        })
      }
      return res.status(403).send({ message: "Contract not found" })
    })
  } catch (err: any) {
    res.status(500).send({ message: err.message })
  }
}

export const createNFT: RequestHandler = async (req, res) => {
  try {
    Contract.findOne({
      where: {
        chainId: req.body.chainId,
        hash: getHashContractNFT().toHexString(),
        name: 'NFT',
      }
    }).then(async (contract) => {
      if (contract) {
        const network = getNetworkFromChainId(req.body.chainId)
        if (network) {
          const privateKeys = getPrivateKey(req.body.chainId)
          const wallet = getWallet(network, privateKeys)
          const contractNFT = getContractNFT(contract.address, wallet)
          const tx = await contractNFT.createNFT(req.body.owner, req.body.uri)
          await tx.wait()
          return res.send({
            message: 'NFT created'
          })
        }
        return res.status(403).send({ message: "Network not found" })
      }
      return res.status(403).send({ message: "Contract not found" })
    })
  } catch (err: any) {
    res.status(500).send({ message: err.message })
  }
}
