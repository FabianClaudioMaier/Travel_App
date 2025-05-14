import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import api from '@/services/api'
import { Region, Regions } from '@/interfaces/destinations'
import RegionCard from './RegionCard'

const RegionsList = () => {
    const [regions, setRegions] = useState<Regions>()

    const fetchRegions = async () => {
        try {
            const regions = await api.destinations.getAllRegions()
            setRegions(regions)
        } catch (error) {
            console.error('Error fetching regions:', error)
        }
    }
    useEffect(() => {
        fetchRegions()
    }, [])


    return (
        <FlatList
            data={regions}
            renderItem={({ item }) => (
                <RegionCard region={item} />
            )}
            keyExtractor={(item) => item.id.toString()}
        />
    )
}

export default RegionsList

const styles = StyleSheet.create({})