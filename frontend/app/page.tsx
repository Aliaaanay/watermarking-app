"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Text,
  Image,
  VStack,
  SimpleGrid,
  useToast,
  Icon,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  Select,
  HStack,
  Badge,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
} from "@chakra-ui/react";
import {
  DownloadIcon,
  AttachmentIcon,
  ViewIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";
import axios from "axios";

// --- SETUP COMPONENT ---
const MotionCard = motion(Card);

const THEME_BG = "#050505";
const THEME_CARD = "#141414";

export default function Home() {
  // --- STATE DATA ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);

  // State Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- STATE KONTROL ---
  const [mode, setMode] = useState<"text" | "logo">("text");
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [position, setPosition] = useState<string>("center");
  const [opacity, setOpacity] = useState<number>(120); // Sedikit lebih transparan defaultnya

  // --- PERBAIKAN DI SINI (UKURAN) ---
  const [sizeScale, setSizeScale] = useState<number>(3); // Default jadi 3 (Kecil & Pas)

  const [rotation, setRotation] = useState<number>(0);
  const [color, setColor] = useState<string>("#E50914");
  const [isTiled, setIsTiled] = useState<boolean>(false);

  const toast = useToast();

  // --- HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format Salah",
          description: "Harap upload file gambar.",
          status: "error",
        });
        return;
      }
      setSelectedImage(URL.createObjectURL(file));
      setFileObject(file);
      setProcessedImage(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const applyWatermark = async () => {
    if (!fileObject) {
      toast({
        title: "Gambar Kosong",
        description: "Upload gambar utama terlebih dahulu.",
        status: "warning",
      });
      return;
    }

    if (mode === "logo" && !logoFile) {
      toast({
        title: "Logo Kosong",
        description: "Upload file logo terlebih dahulu.",
        status: "warning",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", fileObject);
      formData.append("mode", mode);
      formData.append("position", position);
      formData.append("opacity", opacity.toString());
      formData.append("size", sizeScale.toString());
      formData.append("rotation", rotation.toString());

      if (mode === "text") {
        formData.append("text", watermarkText);
        formData.append("color", color);
        formData.append("tiled", isTiled ? "true" : "false");
      } else {
        if (logoFile) formData.append("logo_file", logoFile);
      }

      const response = await axios.post(
        "http://127.0.0.1:5000/process-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setProcessedImage(response.data.image);
      toast({
        title: "Sukses!",
        description: "Watermark berhasil diterapkan.",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Gagal",
        description:
          "Tidak dapat terhubung ke backend. Pastikan server.py jalan.",
        status: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={THEME_BG}
      color="white"
      fontFamily="sans-serif"
      overflowX="hidden"
      position="relative"
    >
      {/* Background Glow Effect */}
      <Box
        position="absolute"
        top="-100px"
        left="-100px"
        w="500px"
        h="500px"
        bg={mode === "text" ? color : "purple.500"}
        filter="blur(150px)"
        opacity={0.15}
        transition="background 0.5s ease"
        zIndex={0}
      />

      <Container
        maxW="container.xl"
        py={{ base: 6, md: 12 }}
        position="relative"
        zIndex={1}
      >
        {/* HEADER */}
        <VStack
          spacing={2}
          mb={{ base: 8, md: 16 }}
          alignItems={{ base: "center", md: "flex-start" }}
          textAlign={{ base: "center", md: "left" }}
        >
          <Badge
            colorScheme={mode === "text" ? "red" : "purple"}
            variant="solid"
            px={2}
            borderRadius="sm"
          >
            ULTIMATE VERSION v3.1
          </Badge>
          <Heading
            as="h1"
            size={{ base: "2xl", md: "3xl" }}
            fontWeight="900"
            letterSpacing="tight"
          >
            STUDIO{" "}
            <Text
              as="span"
              color={mode === "text" ? color : "purple.400"}
              transition="color 0.3s"
            >
              WATERMARK.
            </Text>
          </Heading>
          <Text color="gray.500" maxW="600px">
            Professional tool for Text & Logo watermarking. Secure your assets
            now.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={{ base: 8, lg: 10 }}>
          {/* --- KOLOM KIRI: KONTROL (4/12) --- */}
          <Box gridColumn={{ lg: "span 4" }}>
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              bg={THEME_CARD}
              borderColor="gray.800"
              borderWidth={1}
              shadow="2xl"
              borderRadius="xl"
            >
              <CardBody p={6}>
                <VStack spacing={6} align="stretch">
                  <HStack
                    color="gray.400"
                    fontSize="xs"
                    fontWeight="bold"
                    letterSpacing="widest"
                  >
                    <SettingsIcon /> <Text>CONFIGURATION PANEL</Text>
                  </HStack>

                  {/* 1. UPLOAD UTAMA */}
                  <FormControl>
                    <FormLabel
                      fontSize="10px"
                      color="gray.500"
                      mb={1}
                      textTransform="uppercase"
                    >
                      Main Image
                    </FormLabel>
                    <Box
                      position="relative"
                      h="80px"
                      border="2px dashed"
                      borderColor="gray.700"
                      borderRadius="lg"
                      bg="blackAlpha.400"
                      _hover={{ borderColor: color, bg: "blackAlpha.600" }}
                      transition="all 0.2s"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
                    >
                      <Input
                        type="file"
                        h="100%"
                        w="100%"
                        position="absolute"
                        opacity="0"
                        cursor="pointer"
                        accept="image/*"
                        onChange={handleImageUpload}
                        zIndex={2}
                      />
                      {selectedImage ? (
                        <Image
                          src={selectedImage}
                          alt="Preview"
                          h="100%"
                          w="100%"
                          objectFit="cover"
                          opacity={0.6}
                        />
                      ) : (
                        <HStack spacing={2} color="gray.500">
                          <Icon as={AttachmentIcon} />
                          <Text fontSize="xs" fontWeight="bold">
                            UPLOAD SOURCE
                          </Text>
                        </HStack>
                      )}
                    </Box>
                  </FormControl>

                  {/* 2. MODE TABS */}
                  <Tabs
                    isFitted
                    variant="soft-rounded"
                    colorScheme={mode === "text" ? "red" : "purple"}
                    onChange={(idx) => setMode(idx === 0 ? "text" : "logo")}
                  >
                    <TabList bg="black" p={1} borderRadius="full">
                      <Tab
                        fontSize="xs"
                        fontWeight="bold"
                        color="gray.500"
                        _selected={{ color: "white", bg: "gray.800" }}
                      >
                        TEXT MODE
                      </Tab>
                      <Tab
                        fontSize="xs"
                        fontWeight="bold"
                        color="gray.500"
                        _selected={{ color: "white", bg: "gray.800" }}
                      >
                        LOGO MODE
                      </Tab>
                    </TabList>

                    <TabPanels mt={4}>
                      {/* PANEL TEKS */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          <FormControl>
                            <FormLabel fontSize="10px" color="gray.500" mb={1}>
                              CONTENT
                            </FormLabel>
                            <Input
                              value={watermarkText}
                              onChange={(e) => setWatermarkText(e.target.value)}
                              bg="black"
                              border="1px solid"
                              borderColor="gray.800"
                              _focus={{ borderColor: color }}
                              h="40px"
                              fontSize="sm"
                            />
                          </FormControl>

                          <HStack>
                            <FormControl>
                              <FormLabel
                                fontSize="10px"
                                color="gray.500"
                                mb={1}
                              >
                                COLOR
                              </FormLabel>
                              <HStack
                                spacing={0}
                                border="1px solid"
                                borderColor="gray.800"
                                borderRadius="md"
                                overflow="hidden"
                              >
                                <Input
                                  type="color"
                                  value={color}
                                  onChange={(e) => setColor(e.target.value)}
                                  h="35px"
                                  w="40px"
                                  p={0}
                                  bg="transparent"
                                  border="none"
                                  cursor="pointer"
                                />
                                <Input
                                  value={color}
                                  readOnly
                                  bg="black"
                                  border="none"
                                  color="gray.400"
                                  fontSize="xs"
                                  h="35px"
                                  w="full"
                                  fontFamily="monospace"
                                />
                              </HStack>
                            </FormControl>
                            <FormControl
                              display="flex"
                              flexDirection="column"
                              alignItems="flex-end"
                            >
                              <FormLabel
                                fontSize="10px"
                                color="gray.500"
                                mb={1}
                              >
                                TILED (FULL)
                              </FormLabel>
                              <Switch
                                colorScheme="red"
                                isChecked={isTiled}
                                onChange={(e) => setIsTiled(e.target.checked)}
                                size="lg"
                              />
                            </FormControl>
                          </HStack>
                        </VStack>
                      </TabPanel>

                      {/* PANEL LOGO */}
                      <TabPanel p={0}>
                        <FormControl>
                          <FormLabel fontSize="10px" color="gray.500" mb={1}>
                            UPLOAD LOGO (PNG)
                          </FormLabel>
                          <Box
                            position="relative"
                            h="60px"
                            border="1px dashed"
                            borderColor="gray.600"
                            borderRadius="md"
                            bg="blackAlpha.300"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Input
                              type="file"
                              h="100%"
                              w="100%"
                              position="absolute"
                              opacity="0"
                              cursor="pointer"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            {logoPreview ? (
                              <Image
                                src={logoPreview}
                                alt="Logo Preview"
                                h="40px"
                                objectFit="contain"
                              />
                            ) : (
                              <Text fontSize="xs" color="gray.500">
                                Click to upload logo
                              </Text>
                            )}
                          </Box>
                        </FormControl>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>

                  {/* 3. SETTING UMUM (Posisi, Opacity, Size, Rotasi) */}
                  <Box
                    p={4}
                    bg="blackAlpha.500"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.800"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.400"
                      mb={3}
                    >
                      ADJUSTMENTS
                    </Text>

                    {/* POSISI */}
                    {!isTiled && (
                      <FormControl mb={3}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="10px" color="gray.500">
                            POSITION
                          </Text>
                        </HStack>
                        <Select
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          bg="black"
                          border="1px solid"
                          borderColor="gray.800"
                          size="sm"
                          fontSize="xs"
                          aria-label="Select Position"
                          title="Select Position" // PERBAIKAN FINAL: Menambahkan Title
                        >
                          <option value="center">Center</option>
                          <option value="top-left">Top Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                        </Select>
                      </FormControl>
                    )}

                    {/* OPACITY */}
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="10px" color="gray.500">
                        OPACITY ({Math.round((opacity / 255) * 100)}%)
                      </Text>
                    </HStack>
                    <Slider
                      aria-label="opacity"
                      value={opacity}
                      min={0}
                      max={255}
                      onChange={(v) => setOpacity(v)}
                      mb={3}
                    >
                      <SliderTrack bg="gray.800">
                        <SliderFilledTrack
                          bg={mode === "text" ? color : "purple.500"}
                        />
                      </SliderTrack>
                      <SliderThumb boxSize={3} bg="white" shadow="lg" />
                    </Slider>

                    {/* SIZE SLIDER (RANGE BARU 1-30) */}
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="10px" color="gray.500">
                        SIZE SCALE ({sizeScale}%)
                      </Text>
                    </HStack>
                    <Slider
                      aria-label="size"
                      value={sizeScale}
                      min={1}
                      max={30}
                      step={1}
                      onChange={(v) => setSizeScale(v)}
                      mb={3}
                    >
                      <SliderTrack bg="gray.800">
                        <SliderFilledTrack bg="blue.500" />
                      </SliderTrack>
                      <SliderThumb boxSize={3} bg="white" shadow="lg" />
                    </Slider>

                    {/* ROTATION */}
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="10px" color="gray.500">
                        ROTATION ({rotation}°)
                      </Text>
                    </HStack>
                    <Slider
                      aria-label="rotation"
                      value={rotation}
                      min={0}
                      max={360}
                      onChange={(v) => setRotation(v)}
                    >
                      <SliderTrack bg="gray.800">
                        <SliderFilledTrack bg="green.500" />
                      </SliderTrack>
                      <SliderThumb boxSize={3} bg="white" shadow="lg" />
                    </Slider>
                  </Box>

                  <Button
                    onClick={applyWatermark}
                    isLoading={isProcessing}
                    loadingText="RENDERING..."
                    bg={mode === "text" ? color : "purple.600"}
                    color="white"
                    _hover={{
                      filter: "brightness(1.1)",
                      transform: "translateY(-1px)",
                    }}
                    _active={{ transform: "translateY(0)" }}
                    w="full"
                    size="lg"
                    fontSize="sm"
                    fontWeight="bold"
                    transition="all 0.2s"
                  >
                    {mode === "text"
                      ? "APPLY TEXT WATERMARK"
                      : "APPLY LOGO WATERMARK"}
                  </Button>
                </VStack>
              </CardBody>
            </MotionCard>
          </Box>

          {/* --- KOLOM KANAN: PREVIEW (8/12) --- */}
          <Box gridColumn={{ lg: "span 8" }}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              bg={THEME_CARD}
              borderColor="gray.800"
              borderWidth={1}
              h="full"
              minH="600px"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
            >
              <CardBody
                p={0}
                bg="black"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {/* Background Checkerboard pattern for transparency */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  backgroundImage="linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)"
                  backgroundSize="20px 20px"
                  backgroundPosition="0 0, 0 10px, 10px -10px, -10px 0px"
                  opacity={0.2}
                  pointerEvents="none"
                />

                {processedImage ? (
                  <Box
                    position="relative"
                    w="full"
                    h="full"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={8}
                  >
                    <Image
                      src={processedImage}
                      alt="Result"
                      maxH="550px"
                      maxW="100%"
                      objectFit="contain"
                      boxShadow="dark-lg"
                      borderRadius="sm"
                    />

                    <Button
                      as="a"
                      href={processedImage}
                      download="watermarked_ultimate.png"
                      position="absolute"
                      bottom={8}
                      right={8}
                      leftIcon={<DownloadIcon />}
                      bg="white"
                      color="black"
                      size="sm"
                      shadow="xl"
                      _hover={{ bg: "gray.200" }}
                    >
                      DOWNLOAD RESULT
                    </Button>
                  </Box>
                ) : (
                  <VStack spacing={4} opacity={0.3}>
                    <Icon as={ViewIcon} w={16} h={16} color="gray.600" />
                    <Text
                      letterSpacing="widest"
                      fontWeight="bold"
                      color="gray.500"
                    >
                      PREVIEW MONITOR
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Waiting for processing...
                    </Text>
                  </VStack>
                )}
              </CardBody>
            </MotionCard>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
